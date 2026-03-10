import { Prisma, PrismaClient, group_organisations } from "../../generated/prisma";
import prisma from "../config/prisma.config";
import { bigIntToString } from "../utils/utils";



export type GroupOrganisationType =  {
    group_id: string,
    organisation_id: string
}

export class GroupOrganisation {

    static async getByGroupId (groupID: string): Promise<GroupOrganisationType[]> {
        const result = await prisma.group_organisations.findMany({
            where: {'group_id': BigInt(groupID)}
        });

        return bigIntToString(result);
    }

    static async deleteByGroupID (
        groupID: string, 
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ) {
        const result = await prismaClient.group_organisations.deleteMany({
            where: {
                group_id: bigIntToString(groupID)
            }
        });

        return result;
    }

    static async createMany(
        data: Prisma.group_organisationsCreateManyInput[],
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ) {
        const result = await prismaClient.group_organisations.createManyAndReturn({
            data,
            skipDuplicates: true,
        });

        return bigIntToString(result);
    }
}