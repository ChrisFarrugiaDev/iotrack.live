import { organisations } from '../../generated/prisma'
import prisma from '../config/prisma.config';

export type OrganisationType = Omit<organisations, 'id' | 'parent_org_id'> & {
    id: string;
    parent_org_id: string | null;
};

export class Organisation {

    // Get all descendant orgs (including self), as OrganisationType objects
    static async getOrgScope(orgId: bigint | string): Promise<string[]> {
        const id = typeof orgId === 'string' ? BigInt(orgId) : orgId;
        const result = await prisma.$queryRawUnsafe(`
            WITH RECURSIVE org_scope AS (
                SELECT id
                FROM app.organisations
                WHERE id = $1
                UNION ALL
                SELECT o.id
                FROM app.organisations o
                INNER JOIN org_scope os ON o.parent_org_id = os.id
            )
            SELECT * FROM org_scope;
        `, id) as { id: bigint }[];

        return result.map((org: { id: bigint }) => {
            return org.id.toString()
        });
    }

    // -----------------------------------------------------------------

    // Combines a default scope with explicit allow and deny overrides.
    static mergeScopeWithOverrides(defaultList: string[], allowList: string[], denyList: string[]) {
        const set = new Set(defaultList);
        for (const id of allowList) set.add(id);
        for (const id of denyList) set.delete(id);

        return Array.from(set);
    }
}
