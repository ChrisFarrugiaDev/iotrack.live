import { uuidv7 } from 'uuidv7';
import { PrismaClient, codec12_commands } from '../../generated/prisma';
import * as types from "../types/index"



const prisma = new PrismaClient();

export class TeltonikaCodec12Commands {

    // -----------------------------------------------------------------

    // Create a new command
    static async createCommand(payload: Omit<codec12_commands, 'id' | 'uuid' | 'created_at' | 'updated_at' | 'sent_at' | 'responded_at' | 'response' | 'retries'>
    ): Promise<types.TeltonikaCodec12Command> {
        const record = await prisma.codec12_commands.create({
            data: {
                ...payload,
                uuid: uuidv7(),
            }
        });

        return {
            ...record,
            id: record.id.toString()
        }
    }

    // -----------------------------------------------------------------

    static async createBulk(
        records: Array<Omit<codec12_commands, 'id' | 'uuid' | 'created_at' | 'updated_at' | 'sent_at' | 'responded_at' | 'response' | 'retries'>>
    ): Promise<string[]> {
        // Add uuid to each record
        const recordsWithUUID = records.map(data => ({
            ...data,
            uuid: uuidv7(),
        }))

        // Fetch inserted records by UUIDs
        const uuids = recordsWithUUID.map(r => r.uuid);

        await prisma.codec12_commands.createMany({
            data: recordsWithUUID,
            skipDuplicates: false
        })

        return uuids;
    }

    // -----------------------------------------------------------------

    static async findManyByUUID(uuids: string[]): Promise<types.TeltonikaCodec12Command[]> {
        const records = await prisma.codec12_commands.findMany({
            where: {
                uuid: { in: uuids }
            }
        });

        const sanitizeRecords = records.map(rec => {
            return {
                ...rec,
                id: rec.id.toString(),
            }
        })

        return sanitizeRecords;
    }

    // -----------------------------------------------------------------

    // Find by id
static async findById(id: bigint): Promise<types.TeltonikaCodec12Command | null> {
    const command = await prisma.codec12_commands.findUnique({
        where: { id }
    });
    return command ? { ...command, id: command.id.toString() } : null;
}

    // Get all
    static async getAll() {
        return prisma.codec12_commands.findMany();
    }



    // ...add more custom methods as needed!
}
