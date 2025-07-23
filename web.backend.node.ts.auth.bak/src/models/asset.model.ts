import { assets } from '@root/generated/prisma'
import { bigIntToString } from '../utils/utils';
import prisma from '../config/prisma.config';



export class Asset {

    static async getByOrganisationID(organisationID: string) {
        const assets = await prisma.assets.findMany({
            where: { 'organisation_id': BigInt(organisationID) }
        })

        // Always return an array, convert all BigInt fields to strings (recursively)
        return bigIntToString(assets);
    }
}