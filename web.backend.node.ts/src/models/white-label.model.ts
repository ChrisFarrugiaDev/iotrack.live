import { white_label } from '../../generated/prisma'
import prisma from '../config/prisma.config';

export type WhiteLabelType = Omit<white_label, 'id' | 'organisation_id'> & {
    id: string;
    organisation_id: string;
};

export type WhiteLabelPublic = {
    app_title: string | null;
    login_bg_url: string | null;
    login_fg_url: string | null;
};

function toType(row: white_label): WhiteLabelType {
    return {
        ...row,
        id: row.id.toString(),
        organisation_id: row.organisation_id.toString(),
    };
}

export class WhiteLabel {
    // -----------------------------------------------------------------

    static async getByOrgId(orgId: string): Promise<WhiteLabelType | null> {
        const row = await prisma.white_label.findUnique({
            where: { organisation_id: BigInt(orgId) }
        });
        return row ? toType(row) : null;
    }

    // -----------------------------------------------------------------

    static async getByDomain(domain: string): Promise<WhiteLabelType | null> {
        const row = await prisma.white_label.findUnique({
            where: { domain }
        });
        return row ? toType(row) : null;
    }

    // -----------------------------------------------------------------

    // Walk up the org tree until an org with a white_label row is found.
    static async getEffectiveByOrgId(orgId: string): Promise<WhiteLabelType | null> {
        let currentOrg = await prisma.organisations.findUnique({
            where: { id: BigInt(orgId) }
        });

        while (currentOrg) {
            const row = await prisma.white_label.findUnique({
                where: { organisation_id: currentOrg.id }
            });
            if (row) return toType(row);

            if (!currentOrg.parent_org_id) return null;

            const parentOrg = await prisma.organisations.findUnique({
                where: { id: currentOrg.parent_org_id }
            });
            if (!parentOrg) return null;

            currentOrg = parentOrg;
        }

        return null;
    }

    // -----------------------------------------------------------------

    static async upsertForOrg(
        orgId: string,
        data: Partial<Pick<white_label, 'domain' | 'app_title' | 'login_bg_url' | 'login_fg_url'>>
    ): Promise<WhiteLabelType> {
        const row = await prisma.white_label.upsert({
            where: { organisation_id: BigInt(orgId) },
            update: data,
            create: {
                organisation_id: BigInt(orgId),
                ...data,
            },
        });
        return toType(row);
    }

    // -----------------------------------------------------------------
}
