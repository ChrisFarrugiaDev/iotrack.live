import { Prisma, PrismaClient } from '../../generated/prisma'
import prisma from '../config/prisma.config';
import { bigIntToString } from '../utils/utils';


export class UserOrganisationAccess {

    //  Get all org access overrides for a given user.
    //  Returns an array (possibly empty) of override objects.   
    static async getUserOrgOverrides(userId: number | bigint | string) {
        let user_id: bigint;

        // Convert input to bigint safely
        try {
            user_id = typeof userId === 'bigint'
                ? userId
                : BigInt(userId);
        } catch (err) {
            throw new Error(`Invalid userId: ${userId}`);
        }

        const overrides = await prisma.user_organisation_access.findMany({
            where: { user_id }
        });

        // Always return an array, convert all BigInt fields to strings (recursively)
        return bigIntToString(overrides);
    }   
    
    // -----------------------------------------------------------------

    static async create(
        perm: Prisma.user_organisation_accessCreateInput,
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ) {

        const result = await prismaClient.user_organisation_access.create({
            data: perm
        })

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async createMany(
        perms: Prisma.user_organisation_accessCreateManyInput[],
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ) {

        const result = await prismaClient.user_organisation_access.createManyAndReturn({
            data: perms,
            skipDuplicates: true,
        })

        return bigIntToString(result);
    }
}
