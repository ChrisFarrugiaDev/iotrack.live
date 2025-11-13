import prisma from '../config/prisma.config';

export class Permissions {

    static async getAll() {
        const permissions = await prisma.permissions.findMany();
 
        return permissions;
    }
}