import { Prisma, PrismaClient, user_permissions } from '../../generated/prisma';
import prisma from '../config/prisma.config';

import { bigIntToString } from '../utils/utils';


export type UserPermissionsType = user_permissions;

export class UserPermissions {

    static async create(
        perm: Prisma.user_permissionsCreateInput,
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ) {

        const result = await prismaClient.user_permissions.create({
            data: perm
        })

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async createMany(
        perms: Prisma.user_permissionsCreateManyInput[],
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ) {

        const result = await prismaClient.user_permissions.createManyAndReturn({
            data: perms,
            skipDuplicates: true,
        })

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async getByUserID(userID: string): Promise<UserPermissionsType[]> {
        const result = await prisma.user_permissions.findMany({
            where: { 'user_id': BigInt(userID) }
        })

        return bigIntToString(result);
    }
}


