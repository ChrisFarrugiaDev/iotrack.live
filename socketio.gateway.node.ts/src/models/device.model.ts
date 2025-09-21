import { PrismaClient } from "@prisma/client";
import { Prisma, devices } from "../../generated/prisma";
import prisma from "../config/prisma.config";
import { bigIntToString } from "../utils/utils";

export type DeviceType = Omit<devices, 'id'> & {
    id: string;
}

type ListOpts = {
    skip: number;
    take: number;
    sortBy: "id" | "external_id" | "model" | "vendor";
    order: "asc" | "desc";
};
export class Device {

    // count - returns how many rows exist in the devices table
    static async count(): Promise<number> {
        return prisma.devices.count();
    }

    // -----------------------------------------------------------------


    static async getAll(): Promise<DeviceType[]> {   

        const result = await prisma.devices.findMany({});

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------


    static async list({ skip, take, sortBy, order }: ListOpts): Promise<DeviceType[]> {
        const result = await prisma.devices.findMany({
            skip,
            take,
            orderBy:{[sortBy]: order}
        });

        return bigIntToString(result);
    }

    // -----------------------------------------------------------------

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

    static async getAccessibleDeviceIDs(
        organisationIDs: string[],
        denyDeviceIDs: string[] = []
    ): Promise<string[]> {
        const ids = organisationIDs.map(id => BigInt(id));

        const result = await prisma.devices.findMany({
            where: {
                organisation_id: { in: ids },
            },
            select: { id: true }, // only fetch device IDs
        });

        // Convert all to strings
        const allDeviceIDs = result.map(r => String(r.id));

        // Filter out denied IDs
        const deniedSet = new Set(denyDeviceIDs.map(id => id.trim()));
        return allDeviceIDs.filter(id => !deniedSet.has(id));
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

    static async create(device: Prisma.devicesCreateInput) {

        const result = await prisma.devices.create({
            data: device
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

    static async updateByID(
        deviceID: string, 
        data: Prisma.devicesUpdateInput,
        prismaClient: Prisma.TransactionClient | PrismaClient = prisma
    ): Promise<DeviceType> {
        const result = await prismaClient.devices.update({
            where: {id: BigInt(deviceID)},
            data
        });

        return bigIntToString(result);
    }
    
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