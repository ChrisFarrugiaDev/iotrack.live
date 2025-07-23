import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

import { User } from "../../models/user.model";
import { Organisation, OrganisationType } from "../../models/organisation.model";
import { UserOrganisationAccess } from "../../models/user-organisation-access.model";

import { users, organisations, roles } from '../../../generated/prisma'
import { ApiResponse } from "../../types";
import { UserJWT } from "../../types/user-jwt";

// Utility: Get secret from env or throw early (prevents server starting if missing)
function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');
    return secret;
}

class AuthController {
    
    // Generate a JWT token for the authenticated user.
    static generateToken(user: users, role: roles, org: organisations): string {
        const payload: UserJWT = {
            sub: user.uuid,
            email: user.email,
            role: role.name,
            org_uuid: org.uuid
        };
        return jwt.sign(payload, getJwtSecret(), { expiresIn: '1h' });
    }

    // -------------------------------------------------------------------------

    // Fetch and merge user's organization scopes (default + overrides).
    static async fetchOrganisationScope(user: users): Promise<Record<string, Partial<OrganisationType>>> {
        const defaultScope = await Organisation.getOrgScope(user.organisation_id);
        const overrides = await UserOrganisationAccess.getUserOrgOverrides(user.id);

        const allow: string[] = [];
        const deny: string[] = [];

        for (const override of overrides) {
            (override.is_allowed ? allow : deny).push(override.organisation_uuid);
        }

        const mergedOrganisations = await Organisation.mergeScopeWithOverrides(defaultScope, allow, deny);

        const organisationOject: Record<string, Partial<OrganisationType> > = {}

        for (let org of mergedOrganisations) {
            organisationOject[org.id] = {
                id: org.id,
                uuid: org.uuid,
                name: org.name,
                parent_org_id: org.parent_org_id,
                description: org.description,
                created_at: org.created_at
            }
        }

        return organisationOject
    }


    static async fetchUserAsset(user: users) {

    }

    // -------------------------------------------------------------------------

    // Login endpoint. Validates user credentials and returns JWT + user profile.
    static async login(req: Request, res: Response<ApiResponse>, next: NextFunction) {
        try {
            const { email, password } = req.body;

            // 1. Find user with roles and org info
            const user = await User.getByEmail(email, ['organisations', 'roles']);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                    error: { code: 'AUTH_FAILED' }
                });
            }

            // 2. Compare password hash (async)
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                    error: { code: 'AUTH_FAILED' }
                });
            }

            // 3. Generate token and user's org scope
            const token = AuthController.generateToken(user, user.roles, user.organisations);
            const organisationScope = await AuthController.fetchOrganisationScope(user);

            // 4. Prepare response profile object (add, remove fields as needed)
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
                organisation_scope: organisationScope,   // all orgs user can access
                assets: ["todo later"],    // fetch with dedicated endpoint if large
                devices: ["todo later"],   // fetch with dedicated endpoint if large
                settings: [],  // placeholder
            };

            return res.json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    access_profile: profile,
                }
            });
            
        } catch (err) {
            // Catch-all error handler for unexpected issues
            next(err);
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
