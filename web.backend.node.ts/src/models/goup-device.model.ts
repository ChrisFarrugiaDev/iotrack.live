import { Prisma, PrismaClient, group_devices } from "../../generated/prisma";
import prisma from "../config/prisma.config";
import { bigIntToString } from "../utils/utils";




export type GroupDeviceType = {
    group_id: string,
    device_id: string,
}

export class GroupDevice {

    static async getByGroupId (groupID: string): Promise<GroupDeviceType[]> {
        const result = await prisma.group_devices.findMany({
            where: {'group_id': BigInt(groupID)}
        });

        return bigIntToString(result);
    }

    static async deleteByGroupID (
        groupID: string, 
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ) {
        const result = await prismaClient.group_devices.deleteMany({
            where: {
                group_id: bigIntToString(groupID)
            }
        });

        return result;
    }

    static async createMany(
        data: Prisma.group_devicesCreateManyInput[],
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ) {
        const result = await prismaClient.group_devices.createManyAndReturn({
            data,
            skipDuplicates: true,
        });

        return bigIntToString(result);
    }
}