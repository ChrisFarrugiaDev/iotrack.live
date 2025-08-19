import { bigIntToString } from '../utils/utils';
import { assets } from '../../generated/prisma';
import prisma from '../config/prisma.config';

export type AssetType = Omit<assets, 'id'> & {
    id: string;
}



export class Asset {

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

    static async getByOrganisationsIDs(organisationIDs: string[]): Promise<AssetType[]> {
        const ids = organisationIDs.map(id => BigInt(id));
        const result = await prisma.assets.findMany({
            where: {
                organisation_id: { in: ids }
            }            
        });
        return bigIntToString(result);
    }
}