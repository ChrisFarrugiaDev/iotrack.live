import { Prisma, PrismaClient, group_users } from "../../generated/prisma";
import prisma from "../config/prisma.config";
import { bigIntToString } from "../utils/utils";



export type GroupUserType =   {
    group_id: string,
    user_id: string
}
export class GroupUser {

    static async getByGroupId (groupID: string): Promise<GroupUserType[]> {
        const result = await prisma.group_users.findMany({
            where: {'group_id': BigInt(groupID)}
        });

        return bigIntToString(result);
    }

    static async deleteByGroupID (
        groupID: string, 
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ) {
        const result = await prismaClient.group_users.deleteMany({
            where: {
                group_id: bigIntToString(groupID)
            }
        });

        return result;
    }

    static async createMany(
        data: Prisma.group_usersCreateManyInput[],
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ) {
        const result = await prismaClient.group_users.createManyAndReturn({
            data,
            skipDuplicates: true,
        });

        return bigIntToString(result);
    }
}