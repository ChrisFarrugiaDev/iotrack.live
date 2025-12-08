import { Prisma, PrismaClient} from '../../generated/prisma';
import { bigIntToString } from '../utils/utils';

import prisma from '../config/prisma.config';

export class UserDeviceAccess {

    static async getByUserID (userID: string) {

        const result = await prisma.user_device_access.findMany({
            where: {'user_id': BigInt(userID)}
        });

        // Always return an array, convert all BigInt fields to strings (recursively)
        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async create(
        perm: Prisma.user_device_accessCreateInput,
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ) {

        const result = await prismaClient.user_device_access.create({
            data: perm
        })

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async createMany(
        perms: Prisma.user_device_accessCreateManyInput[],
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ) {

        const result = await prismaClient.user_device_access.createManyAndReturn({
            data: perms,
            skipDuplicates: true,
        })

        return bigIntToString(result);
    }
}