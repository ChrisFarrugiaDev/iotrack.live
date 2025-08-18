import { devices } from "../../generated/prisma";
import prisma from "../config/prisma.config";
import { bigIntToString } from "../utils/utils";

export type DeviceType = Omit<devices, 'id'> & {
    id: string;
}
export class Device {

    static async getByID(assetID: string): Promise<DeviceType> {
        const result = await prisma.devices.findFirst({
            where: { 'id': BigInt(assetID) }
        })

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async getByOrganisationID(organisationID: string): Promise<DeviceType[]> {
        const result = await prisma.devices.findMany({
            where: { 'organisation_id': BigInt(organisationID) }
        })


        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    static async getByOrganisationsIDs(organisationIDs: string[]): Promise<DeviceType[]> {
        const ids = organisationIDs.map(id => BigInt(id));
        const result = await prisma.devices.findMany({
            where: {
                organisation_id: { in: ids }
            }
        });

         return bigIntToString(result);
    }

    // -----------------------------------------------------------------
    
    static async deleteByIDs(deviceIDs: string[]) {
        const ids = deviceIDs.map(id => BigInt(id));
        const result = await prisma.devices.deleteMany({
            where: {
                id: { in: ids}
            }
        })
        return result;
    }


}