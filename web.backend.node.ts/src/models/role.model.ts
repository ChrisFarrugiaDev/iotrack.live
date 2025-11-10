import { roles } from "../../generated/prisma";
import prisma from "../config/prisma.config";
import { bigIntToString } from "../utils/utils";




export type RoleType = Omit<roles, 'role_id'> & {
    role_id: string
}

export class Role {

    static async getAll(): Promise<Record<string, string>> {

        const roles = await prisma.roles.findMany({});

        const roleMap: Record<string, string> = {};

        for (let role of roles) {
            const role_id = String(role.role_id);
            roleMap[role_id] = role.name;
        }
        
       return roleMap;
    }
}