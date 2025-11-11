import { users } from '../../generated/prisma'
import prisma from '../config/prisma.config';
import { bigIntToString } from '../utils/utils';



export type UserType = Omit<users, 'id' | 'organisation_id'> & {
    id: string;
    organisation_id: string;
};

// Supported user relations for eager loading in Prisma queries
type UserRelation = 'organisations' | 'roles';

export class User {
    
    // Fetches a user by email, with optional related data.
    static async getByEmail(email: string, relations?: UserRelation[]) {
        // Convert array of relation names to Prisma's expected include object
        const includeObj = relations
            ? Object.fromEntries(relations.map(relation => [relation, true]))
            : undefined;

        // Query user by email, with optional relations included
        const user = await prisma.users.findUnique({
            where: { email },
            include: includeObj, // e.g., include: { organisations: true }
        });

        // If found, convert all BigInt fields to strings (recursively)
        if (user) {
            return bigIntToString(user);
        }

        // Return null if not found
        return null;
    }



    static async getByID(id: string, relations?: UserRelation[]) {
                // Convert array of relation names to Prisma's expected include object
        const includeObj = relations
            ? Object.fromEntries(relations.map(relation => [relation, true]))
            : undefined;

        // Query user by email, with optional relations included
        const user = await prisma.users.findUnique({
            where: { id: BigInt(id) },
            include: includeObj, // e.g., include: { organisations: true }
        });

        // If found, convert all BigInt fields to strings (recursively)
        if (user) {
            return bigIntToString(user);
        }

        // Return null if not found
        return null;
    }

    // -----------------------------------------------------------------

    static async getUsersByOrganisationIds(orgIds: string[]): Promise<UserType[]> {
        const ids: bigint[] = orgIds.map(id => BigInt(id));

        const users = await prisma.users.findMany({
            where: { organisation_id: { in: ids } }
        });


        return bigIntToString(users);
    }

    // -----------------------------------------------------------------

    // Increments the user's token_version by 1. 
    // If result > 1000, resets to 1.
    // Returns the new token_version.
    static async updateLoginSession(userId: number): Promise<number> {
        // Use a transaction for consistency
        const result = await prisma.$transaction(async (tx) => {
            // First, get the current version
            const user = await tx.users.findUnique({
                where: { id: userId },
                select: { token_version: true },
            });

            if (!user) {
                throw new Error('User not found');
            }

            let newVersion = user.token_version + 1;
            if (newVersion > 1000) newVersion = 1;

            await tx.users.update({
                where: { id: userId },
                data: { token_version: newVersion, last_login_at: new Date() },
            });

            return newVersion;
        });

        return result;
    }



}
