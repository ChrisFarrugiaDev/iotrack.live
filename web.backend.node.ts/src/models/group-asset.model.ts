import { Prisma, PrismaClient, group_assets } from "../../generated/prisma";
import prisma from "../config/prisma.config";
import { bigIntToString } from "../utils/utils";



export type GroupAssetType = {
    group_id: string,
    asset_id: string,
}


export class GroupAsset {

    static async getByGroupId(groupID: string): Promise<GroupAssetType[]> {
        const result = await prisma.group_assets.findMany({
            where: { 'group_id': BigInt(groupID) }
        });

        return bigIntToString(result);
    }

    static async deleteByGroupID(
        groupID: string,
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ) {
        const result = await prismaClient.group_assets.deleteMany({
            where: {
                group_id: bigIntToString(groupID)
            }
        });

        return result;
    }

    static async createMany(
        data: Prisma.group_assetsCreateManyInput[],
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ) {
        const result = await prismaClient.group_assets.createManyAndReturn({
            data,
            skipDuplicates: true,
        });

        return bigIntToString(result);
    }
}