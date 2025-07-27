import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

import { User, UserType } from "../../models/user.model";
import { Organisation, OrganisationType } from "../../models/organisation.model";
import { UserOrganisationAccess } from "../../models/user-organisation-access.model";

import { users, organisations, roles } from '../../../generated/prisma'
import { ApiResponse } from "../../types";
import { UserJWT } from "../../types/user-jwt";
import * as redisUtils from "../../utils/redis-utils/redis.utils";
import { logError } from "../../utils/logger.utils";

import { UserAssetAccess } from "../../models/user-asset-access.model";
import { Asset, AssetType } from "../../models/asset.model";
import { UserDeviceAccess } from "../../models/user-device-access.model";
import { Device, DeviceType } from "../../models/device.model";


// -----------------------------------------------------------------------------

// Utility: Get secret from env or throw early (prevents server starting if missing)
function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');
    return secret;
}

class AuthController {

    // Generate a JWT token for the authenticated user.
    static generateToken(payload: UserJWT): string {
        return jwt.sign(payload, getJwtSecret(), { expiresIn: '12h' });
    }

    // -------------------------------------------------------------------------


    /**
     * Compute the effective organisation IDs a user can access,
     * considering default scope and overrides.
     */
    static async computeAccessibleOrganisationIds(user: users): Promise<string[]> {
        // 1. Get all descendant orgs for the user's primary organisation.
        const defaultScope = await Organisation.getOrgScope(user.organisation_id);

        // 2. Get any explicit user overrides (allow/deny) for org access.
        const overrides = await UserOrganisationAccess.getUserOrgOverrides(user.id);

        // 3. Categorize overrides into allow and deny lists.
        const allow: string[] = [];
        const deny: string[] = [];
        for (const override of overrides) {
            (override.is_allowed ? allow : deny).push(override.organisation_uuid);
        }

        // 4. Merge default scope and overrides to get the final allowed org IDs.
        return Organisation.mergeScopeWithOverrides(defaultScope, allow, deny);
    }

    // -------------------------------------------------------------------------

    /**
     * Given an array of organisation IDs, fetch their details from Redis
     * and return a map of organisation ID to partial OrganisationType.
     */
    static async buildOrganisationInfoMap(orgIds: string[]): Promise<Record<string, Partial<OrganisationType>>> {
        const organisationMap: Record<string, Partial<OrganisationType>> = {};

        const orgs = await Promise.all(orgIds.map(id => redisUtils.getHashField('organisations', id)));
        orgs.forEach(org => {
            if (org) {
                organisationMap[org.id] = {
                    id: org.id,
                    uuid: org.uuid,
                    name: org.name,
                    parent_org_id: org.parent_org_id,
                    path: org.path,
                    description: org.description,
                    created_at: org.created_at
                };
            }
        });

        return organisationMap;
    }

    // -------------------------------------------------------------------------

    /**
     * Fetch all assets a user can access within the given organisations,
     * applying allow/deny overrides (deny takes precedence).
     */
    static async getAccessibleAssetsForUser(userId: string, organisationIds: string[]) {
        // 1. Get any asset access overrides for this user (allow/deny per asset)
        const overrides = await UserAssetAccess.getByUserID(userId);

        const allow: string[] = [];
        const deny: string[] = [];

        for (const override of overrides) {
            (override.is_allowed ? allow : deny).push(override.asset_id);
        }

        // 2. Fetch all assets in the specified organisations
        const assets = await Asset.getByOrganisationsIDs(organisationIds);

        // 3. Remove assets explicitly denied to the user
        const accessibleAssets = assets.filter((asset: AssetType) => !deny.includes(asset.id));

        // NOTE:  ( allow-list logic can be implemented in the future if needed)

        const assetMap: Record<string, AssetType> = {}

        for (let asset of accessibleAssets) {
            assetMap[asset.id] = asset;
        }


        return assetMap;
    }

    /**
     * Fetch all devices a user can access within the given organisations,
     * applying allow/deny overrides (deny takes precedence).
     */
    static async getAccessibleDevicesForUser(userId: string, organisationIds: string[]) {
        // 1. Get any device access overrides for this user (allow/deny per device)
        const overrides = await UserDeviceAccess.getByUserID(userId);

        const allow: string[] = [];
        const deny: string[] = [];

        for (const override of overrides) {
            (override.is_allowed ? allow : deny).push(override.device_id);
        }

        // 2. Fetch all devices in the specified organisations
        const devices = await Device.getByOrganisationsIDs(organisationIds);

        // 3. Remove devices explicitly denied to the user
        const accessibleDevices = devices.filter((device: DeviceType) => !deny.includes(device.id));

        // NOTE: (allow-list logic can be implemented in the future if needed)
        const deviceMap: Record<string, DeviceType> = {}

        for (let device of accessibleDevices) {
            deviceMap[device.id] = device;
        }
        return deviceMap;
    }

    // -------------------------------------------------------------------------
    static async getUserSettings(user: UserType): Promise<Record<string, any>> {
        const settings: Record<string, any> = {};

        settings['maps_api_key'] = await Organisation.getMapsApiKeyFromCache(user.organisation_id)

        return settings;
    }

    // -------------------------------------------------------------------------

    /**
     * Login endpoint.
     * Validates user credentials and returns JWT + user profile (with access rights).
     */
    static async login(req: Request, res: Response<ApiResponse>, next: NextFunction) {
        try {
            const { email, password } = req.body;

            // 1. Fetch user with roles and organisation info
            const user = await User.getByEmail(email, ['organisations', 'roles']);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                    error: {
                        code: 'AUTH_FAILED',
                        error: process.env.NODE_ENV === "development" ? "Invalid email" : undefined
                    }
                } as ApiResponse);
            }

            // 2. Verify password using bcrypt
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                    error: {
                        code: 'AUTH_FAILED',
                        error: process.env.NODE_ENV === "development" ? "Invalid password" : undefined
                    }
                } as ApiResponse);
            }

            // 3. Bump and store token version for invalidating old tokens
            user.token_version = await User.bumpTokenVersion(user.id);
            await redisUtils.saveToCache(`user:token_version:${user.id}`, user.token_version);

            // 4. Build the JWT payload and sign a new token
            const tokenPayload: UserJWT = {
                sub: user.uuid,
                email: user.email,
                role: user.roles.name,
                org_uuid: user.organisations.uuid,
                token_version: user.token_version,
            };
            const token = AuthController.generateToken(tokenPayload);

            // 5. Compute all accessible organisation IDs for the user
            const accessibleOrgIds = await AuthController.computeAccessibleOrganisationIds(user);

            // 6. Build an organisation info map for all accessible organisations
            const organisationScope = await AuthController.buildOrganisationInfoMap(accessibleOrgIds);

            // 7. Fetch user's accessible assets, devices, and settings
            const assets = await AuthController.getAccessibleAssetsForUser(user.id, accessibleOrgIds);
            const devices = await AuthController.getAccessibleDevicesForUser(user.id, accessibleOrgIds);
            const settings = await AuthController.getUserSettings(user);

            // 8. Prepare the user's profile payload for the response
            const profile = {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: {
                    id: user.roles.role_id,
                    name: user.roles.name,
                },
                organisation: {
                    id: user.organisations.id,
                    uuid: user.organisations.uuid,
                    name: user.organisations.name,
                },
                organisation_scope: organisationScope,
                assets: assets,
                devices: devices,
                settings: settings,
            };

            // 9. Return the successful login response with JWT and user profile
            return res.json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    access_profile: profile,
                }
            } as ApiResponse);

        } catch (err) {
            // Log and return a structured error response for any unexpected error
            logError('! auth.controller.ts login !', err);

            return res.status(500).json({
                success: false,
                message: "An unexpected error occurred. Please try again later.",
                error: {
                    code: "SERVER_ERROR",
                    error: process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : undefined
                }
            } as ApiResponse);
        }
    }


    // ------------------------------------------------------------------------- 

    // Logout endpoint (implement as needed: e.g., blacklist token, clear cookie, etc)
    static async logout(req: Request, res: Response<ApiResponse>, next: NextFunction) {
        // Typically just instruct frontend to delete JWT from storage
        return res.json({
            success: true,
            message: 'Logged out',
        });
    }
}

export default AuthController;
