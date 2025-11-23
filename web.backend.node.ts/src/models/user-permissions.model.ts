import { Prisma, PrismaClient } from '../../generated/prisma';
import prisma from '../config/prisma.config';

import { bigIntToString } from '../utils/utils';

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
}


