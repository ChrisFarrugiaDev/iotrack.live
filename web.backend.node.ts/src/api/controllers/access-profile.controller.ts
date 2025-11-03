import { FastifyRequest, FastifyReply } from "fastify";
import { User, UserType } from "../../models/user.model";
import { logger } from "../../utils/logger.utils";
import { ApiResponse } from "../../types/api-response.type";
import { Organisation, OrganisationType } from "../../models/organisation.model";
import { UserOrganisationAccess } from "../../models/user-organisation-access.model";
import * as redisUtils from "../../utils/redis.utils";
import { UserAssetAccess } from "../../models/user-asset-access.model";
import { Asset, AssetType } from "../../models/asset.model";
import { UserDeviceAccess } from "../../models/user-device-access.model";
import { Device, DeviceType } from "../../models/device.model";
import { AccessProfile } from "../../types/access-profile.type";

// -------------------------------------------------------------------------

export class AccessProfileController {

    /**
     * GET /api/user/access-profile
     * Fetches the authenticated user's full access profile, including
     * organisations, assets, devices, and settings.
     */

    static async getAccessProfile(request: FastifyRequest, reply: FastifyReply) {
        try {
            // 1. Extract the authenticated user ID from the request
            //    (this is set by the auth middleware from the JWT payload)       
            const userID = (request as any)?.userID;

            if (!userID) {
                // If the middleware failed to attach a user ID, treat as bad request
                return reply.status(400).send({
                    success: false,
                    message: 'User ID is required',
                    error: { code: 'MISSING_USER_ID' }
                } as ApiResponse);
            }

            // 2. Load the user from the database with their roles and organisation info
            const user = await User.getByID(userID, ['organisations', 'roles']);
            if (!user) {
                return reply.status(404).send({
                    success: false,
                    message: 'User not found',
                    error: { code: 'USER_NOT_FOUND' }
                } as ApiResponse);
            }

            // 3. Determine all organisation IDs the user can access
            const accessibleOrgIds = await AccessProfileController.computeAccessibleOrganisationIds(user.organisation_id, user.id);

            // 4. Fetch metadata for all accessible organisations from cache
            const organisationScope = await AccessProfileController.buildOrganisationInfoMap(accessibleOrgIds);

            // 5. Fetch all assets/devices/settings the user can access
            const assets = await AccessProfileController.getAccessibleAssetsForUser(user.id, accessibleOrgIds);
            const devices = await AccessProfileController.getAccessibleDevicesForUser(user.id, accessibleOrgIds);
            const settings = await AccessProfileController.getUserSettings(user);

            // 6. Construct the access profile object
            const profile: AccessProfile = {
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
                assets,
                devices,
                settings,
            };

            // 7. Respond with the profile
            return reply.send({
                success: true,
                message: 'Access profile fetched successfully',
                data: { access_profile: profile }
            } as ApiResponse);

        } catch (err: unknown) {
            // Log and return structured error for unexpected exceptions
            logger.error({ err }, '! access-profile.controller.ts getAccessProfile !');

            return reply.status(500).send({
                success: false,
                message: "An unexpected error occurred. Please try again later.",
                error: {
                    code: "SERVER_ERROR",
                    error: process.env.DEBUG === 'true' && err instanceof Error ? err.message : undefined
                }
            } as ApiResponse);
        }
    }

    // -------------------------------------------------------------------------

    /**
     * Compute the effective organisation IDs a user can access,
     * considering default scope and overrides.
     */
    static async computeAccessibleOrganisationIds(organisationID: string, userID: string): Promise<string[]> {
        // 1. Get all descendant orgs for the user's primary organisation.
        const defaultScope = await Organisation.getOrgScope(organisationID);

        // 2. Get any explicit user overrides (allow/deny) for org access.
        const overrides = await UserOrganisationAccess.getUserOrgOverrides(userID);

        // 3. Categorize overrides into allow and deny lists.
        const allow: string[] = [];
        const deny: string[] = [];
        for (const override of overrides) {
            (override.is_allowed ? allow : deny).push(override.organisation_id);
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

        const orgs = await Promise.all(orgIds.map(id => redisUtils.hget('organisations', id, 'iotrack.live:')));
        orgs.forEach(org => {
            if (org) {
                organisationMap[org.id] = {
                    id: org.id,
                    uuid: org.uuid,
                    name: org.name,
                    parent_org_id: org.parent_org_id,
                    path: org.path,
                    can_inherit_key: org.can_inherit_key,
                    attributes: org.attributes,
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
        const assets = await Asset.getByOrganisationsIDs(organisationIds, ['devices']);

        
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
}
