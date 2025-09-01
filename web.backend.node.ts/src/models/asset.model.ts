import { bigIntToString } from '../utils/utils';
import { Prisma, assets } from '../../generated/prisma';
import prisma from '../config/prisma.config';

// ---------------------------------------------------------------------

export type AssetType = Omit<assets, 'id'> & {
    id: string;
    devices?: any[],
}

// Supported user relations for eager loading in Prisma queries
type AssetRelation = 'devices';

// ---------------------------------------------------------------------

export class Asset {

    // count - returns how many rows exist in the assets table
    static async count(): Promise<number> {
        return prisma.assets.count();
    }

    // -----------------------------------------------------------------

    static async getAll(): Promise<AssetType[]> {

        const result = await prisma.assets.findMany({});

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async getByID(assetID: string): Promise<AssetType> {
        const result = await prisma.assets.findFirst({
            where: { 'id': BigInt(assetID) }
        })

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async getByOrganisationID(organisationID: string): Promise<AssetType[]> {
        const result = await prisma.assets.findMany({
            where: { 'organisation_id': BigInt(organisationID) }
        })

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async getByOrganisationsIDs(organisationIDs: string[], relations?: AssetRelation[]): Promise<AssetType[]> {
        const ids = organisationIDs.map(id => BigInt(id));

        // Convert array of relation names to Prisma's expected include object
        const includeObj = relations
            ? Object.fromEntries(relations.map(relation => [relation, true]))
            : undefined;

        const result = await prisma.assets.findMany({
            where: {
                organisation_id: { in: ids }
            },
            include: includeObj, // e.g., include: { organisations: true }
        });
        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async create(
        asset: Prisma.assetsCreateInput,
        relations?: AssetRelation[]
    ) {
        const include =
            relations && relations.length
                ? Object.fromEntries(relations.map(r => [r, true]))
                : undefined;

        const result = await prisma.assets.create({
            data: asset,
            include, // ← return relations
        });

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async updateByID(assetID: string, data: Prisma.assetsUpdateInput): Promise<AssetType> {
        const result = await prisma.assets.update({
            where: { id: BigInt(assetID) },
            data
        });

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async deleteByIDs(assetIDs: string[]) {
        const ids = assetIDs.map(id => BigInt(id));

        const result = await prisma.assets.deleteMany({
            where: {
                id: { in: ids }
            }
        });

        return result;
    }
}