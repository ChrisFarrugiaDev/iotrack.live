import { PrismaClient, users, organisations } from '../../generated/prisma'

const prisma = new PrismaClient();

export class Organisation {

    // -----------------------------------------------------------------

    static async getById(id: string) {
        const organisations = await prisma.organisations.findUnique({
            where: { id: BigInt(id) }
        });

        if (organisations) {
            return { ...organisations, id: organisations.id.toString() }
        }

        return null;
    }

    // -----------------------------------------------------------------

    // Get all descendant org UUIDSs (including self)
    static async getOrgScope(orgId: bigint | string) {
        const id = typeof orgId === 'string' ? BigInt(orgId) : orgId;

        const result = await prisma.$queryRawUnsafe<{ uuid: string }[]>(`
            WITH RECURSIVE org_scope AS (
            SELECT id, uuid
            FROM app.organisations
            WHERE id = $1

            UNION ALL

            SELECT o.id, o.uuid
            FROM app.organisations o
            INNER JOIN org_scope os ON o.parent_org_id = os.id
            )
            SELECT * FROM org_scope;
        `, id);

        // Returns an array of all descendant org UUIDs (including self)
        return result.map(row => row.uuid);
    }

    // Combines a default scope with explicit allow and deny overrides.
    static  mergeScopeWithOverrides(defaultList: string[], allowList: string[], denyList: string[]) {
        const set = new Set(defaultList);
        for (const id of allowList) set.add(id);        
        for (const id of denyList) set.delete(id);
        return Array.from(set);
    }
    // -----------------------------------------------------------------

}