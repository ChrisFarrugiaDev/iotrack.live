import { organisations } from '../../generated/prisma'
import prisma from '../config/prisma.config';
import * as redisUtils from '../utils/redis-utils/redis.utils';
import { bigIntToString } from '../utils/utils';



export type OrganisationType = Omit<organisations, 'id' | 'parent_org_id'> & {
    id: string;
    parent_org_id: string | null;
};

export class Organisation {
    // -----------------------------------------------------------------

    static async getById(id: string): Promise<OrganisationType | null> {
        const org = await prisma.organisations.findUnique({
            where: { id: BigInt(id) }
        });
        if (!org) return null;
        return {
            ...org,
            id: org.id.toString(),
            parent_org_id: org.parent_org_id?.toString() ?? null
        }
    }

    // -----------------------------------------------------------------

    static async getAll(): Promise<OrganisationType[]> {

        const result = await prisma.organisations.findMany()
        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async getByUUIDs(uuids: string[]): Promise<OrganisationType[]> {
        const result = await prisma.organisations.findMany({
            where: {
                uuid: { in: uuids }
            }
        });
        return result.map((org: organisations) => ({
            ...org,
            id: org.id.toString(),
            parent_org_id: org.parent_org_id?.toString() ?? null
        }));
    }

    // -----------------------------------------------------------------

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

    // -----------------------------------------------------------------

    static async getMapsApiKey(orgId: string): Promise<string | null> {
        let currentOrg = await prisma.organisations.findUnique({
            where: { id: BigInt(orgId) }
        });

        while (currentOrg) {
            // If maps_api_key is set, return it
            if (currentOrg.maps_api_key) return currentOrg.maps_api_key;

            // If can_inherit_key is explicitly false, stop and return null
            if (!currentOrg.can_inherit_key) return null;

            // If no parent or parent's can_inherit_key is false, stop
            if (!currentOrg.parent_org_id) return null;

            const parentOrg = await prisma.organisations.findUnique({
                where: { id: currentOrg.parent_org_id }
            });

            // Stop if parent doesn't exist 
            if (!parentOrg) return null;

            currentOrg = parentOrg;
        }

        return null;
    }

    static async getMapsApiKeyFromCache(orgId: string): Promise<string | null> {
        let currentOrg = await redisUtils.getHashField('organisations', orgId)        

        while (currentOrg) {

            // If maps_api_key is set, return it
            if (currentOrg.maps_api_key) return currentOrg.maps_api_key;

            
            // If can_inherit_key is explicitly false, stop and return null
            if (!currentOrg.can_inherit_key) return null;

            
            // If no parent or parent's can_inherit_key is false, stop
            if (!currentOrg.parent_org_id) return null;

            
            const parentOrg = await  redisUtils.getHashField('organisations', currentOrg.parent_org_id)

            // Stop if parent doesn't exist 
            if (!parentOrg) return null;

            
            currentOrg = parentOrg;
        }

        return null;
    }

}
