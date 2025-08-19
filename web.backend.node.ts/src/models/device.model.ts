import { Prisma, devices } from "../../generated/prisma";
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

    // Get external_ids by device IDs
    static async getExternalIDsByIDs(deviceIDs: string[]): Promise<string[]> {
        const ids = deviceIDs.map(id => BigInt(id));

        const result = await prisma.devices.findMany({
            where: { id: { in: ids } },
            select: { external_id: true },
        });

        return result.map(r => r.external_id);
    }

    // -----------------------------------------------------------------

    static async getByOrganisationID(organisationID: string): Promise<DeviceType[]> {
        const result = await prisma.devices.findMany({
            where: { 'organisation_id': BigInt(organisationID) }
        });
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

    // static async upsert(device: Prisma.devicesCreateInput) {
    //     const result = await prisma.devices.upsert({
    //         where: {
    //             external_id_external_id_type: {
    //                 external_id: device.external_id,
    //                 external_id_type: device.external_id_type,
    //             },
    //         },
    //         update: device,
    //         create: device,
    //     });
    //     return bigIntToString(result);
    // }

    // -----------------------------------------------------------------

    static async create(devices: Prisma.devicesCreateInput) {

        const result = await prisma.devices.create({
            data: devices
        });

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

    // static async createMany(devices: Prisma.devicesCreateManyInput[]) {

    //     const result = await prisma.devices.createManyAndReturn({
    //         data: devices,
    //         skipDuplicates: true,
    //     });

    //     return bigIntToString(result);
    // }

    // -----------------------------------------------------------------

    static async deleteByIDs(deviceIDs: string[]) {
        const ids = deviceIDs.map(id => BigInt(id));
        const result = await prisma.devices.deleteMany({
            where: {
                id: { in: ids }
            }
        })
        return result;
    }


    // -----------------------------------------------------------------


}