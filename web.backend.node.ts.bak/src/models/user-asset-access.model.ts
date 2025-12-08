import { Prisma, PrismaClient, user_asset_access } from '../../generated/prisma';
import { bigIntToString } from '../utils/utils';

import prisma from '../config/prisma.config';

export class UserAssetAccess {

    static async getByUserID (userID: string) {

        const assetAccess = await prisma.user_asset_access.findMany({
            where: {'user_id': BigInt(userID)}
        });

        // Always return an array, convert all BigInt fields to strings (recursively)
        return bigIntToString(assetAccess);
    }

    // -----------------------------------------------------------------

    static async create(
        perm: Prisma.user_asset_accessCreateInput,
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ) {

        const result = await prismaClient.user_asset_access.create({
            data: perm
        })

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async createMany(
        perms: Prisma.user_asset_accessCreateManyInput[],
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ) {

        const result = await prismaClient.user_asset_access.createManyAndReturn({
            data: perms,
            skipDuplicates: true,
        })

        return bigIntToString(result);
    }
}