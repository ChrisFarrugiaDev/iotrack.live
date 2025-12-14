import prisma from '../config/prisma.config';

export class RolePermissions {

    static async getGroupedByRole(asMap = false) {
        const result = await prisma.$queryRaw<{ role_id: number; permission_ids: number[] }[]>`
        SELECT 
            role_id, 
            ARRAY_AGG(perm_id ORDER BY perm_id) AS permission_ids
        FROM app.role_permissions
        GROUP BY role_id
        ORDER BY role_id;
        `;

        if (asMap) {
            return Object.fromEntries(result.map(r => [r.role_id, r.permission_ids]));
        }
        return result;
    }


    static async getByRoleID(roleID: number | string) {
        const result = await prisma.role_permissions.findMany({
            where: { 'role_id': Number(roleID) }
        })

        return result
    }
}