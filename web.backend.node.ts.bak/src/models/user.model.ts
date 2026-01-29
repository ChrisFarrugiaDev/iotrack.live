import prisma from '../config/prisma.config';
import { Prisma, PrismaClient, users, organisations, roles } from "../../generated/prisma";
import { bigIntToString } from '../utils/utils';



export type UserType = Omit<users, 'id' | 'organisation_id'> & {
    id: string;
    organisation_id: string;
    organisations?: organisations,
    roles?: roles
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



    static async getByID(id: string, relations?: UserRelation[]):Promise<UserType | null>  {
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

    static async getByIds(ids: string[]): Promise<UserType[] | null> {

        const users = await prisma.users.findMany({
            where: { id: {in: ids.map(id => BigInt(id))} }
        });

        return bigIntToString(users);
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


    static async markLogin(userId: number): Promise<void> {
        await prisma.users.update({
            where: { id: userId },
            data: { last_login_at: new Date() },
        });
    }


    static async bumpTokenVersion(userId: number): Promise<number> {
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { token_version: true },
        });

        if (!user) throw new Error("User not found");

        const newVersion = user.token_version >= 1000
            ? 1
            : user.token_version + 1;

        const updated = await prisma.users.update({
            where: { id: userId },
            data: { token_version: newVersion },
            select: { token_version: true },
        });

        return updated.token_version;
    }

    // -----------------------------------------------------------------

    static async create(
        user: Prisma.usersCreateInput,
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ): Promise<UserType> {

        const result = await prismaClient.users.create({
            data: user
        })

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async deleteByIDs(userIDs: string[]) {
        const ids = userIDs.map(id => BigInt(id));
        const result = await prisma.users.deleteMany({
            where: {
                id: { in: ids }
            }
        })
        return result;
    }


    // -----------------------------------------------------------------

    static async updateByID(
        orgID: string,
        data: Prisma.usersUpdateInput,
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ): Promise<UserType> {

        const result = await prismaClient.users.update({
            where: { id: BigInt(orgID) },
            data
        });

        return bigIntToString(result);
    }
}

