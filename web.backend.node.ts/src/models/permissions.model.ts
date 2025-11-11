import prisma from '../config/prisma.config';

export class Permissions {

    static async getAll() {
        const permissions = await prisma.permissions.findMany();
 
        return permissions.map(perm => ({...perm, perm_id: String(perm.perm_id)}))
    }
}