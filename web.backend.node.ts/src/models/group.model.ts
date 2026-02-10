import { Prisma, PrismaClient, groups } from "../../generated/prisma";
import prisma from "../config/prisma.config";
import { bigIntToString } from "../utils/utils";



export type GroupType = Omit<groups, 'id'> & {
    id: string;
}


export class Group {

    // -----------------------------------------------------------------

    static async getByIds(
        ids: string[],
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ): Promise<GroupType[] | null> {

        if (!ids || ids.length === 0) return [];

        const grps = await prismaClient.groups.findMany({
            where: { id: { in: ids.map(id => BigInt(id)) } }
        });

        return bigIntToString(grps);
    }

    // -----------------------------------------------------------------

    static async create(group: Prisma.groupsCreateInput): Promise<GroupType> {
        const result = await prisma.groups.create({
            data: group
        });

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------


    static async getByOrganisation(organisationID: string | number | bigint) {

        const id = BigInt(organisationID);

        const result = await prisma.groups.findMany({
            where: {
                organisation_id: id
            }
        });

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async getByNameAndOrgId(name: string , organisationID: string | number | bigint) {

        const id = BigInt(organisationID);

        const result = await prisma.groups.findFirst({
            where: {
                organisation_id: id,
                name: name
            }
        });

        return bigIntToString(result);
    }



    // -----------------------------------------------------------------


    static async deleteByIDs(groupIDs: string[]) {
        const ids = groupIDs.map(id => BigInt(id));
        const result = await prisma.groups.deleteMany({
            where: {
                id: { in: ids }
            }
        })
        return result;
    }
}