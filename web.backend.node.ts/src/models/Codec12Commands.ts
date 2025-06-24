import { uuidv7 } from 'uuidv7';
import { PrismaClient, codec12_commands } from '../../generated/prisma';
import * as types from "../types/index"
const prisma = new PrismaClient();

export class Codec12Commands {

    // -----------------------------------------------------------------

    // Create a new command
    static async createCommand(payload: Omit<codec12_commands, 'id' | 'uuid' | 'created_at' | 'sent_at' | 'responded_at' | 'response' | 'retries'>
    ):Promise<types.Codec12Command> {
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
        records: Array<Omit<codec12_commands, 'id' | 'uuid' | 'created_at' | 'sent_at' | 'responded_at' | 'response' | 'retries'>>
    ): Promise<string[]> {
        // Add uuid to each record
        const recordsWithUUID = records.map(data => ({
            ...data,
            uuid: uuidv7(),
        }))

        // Fetch inserted records by UUIDs
        const uuids = recordsWithUUID.map(r => r.uuid);

        await prisma.codec12_commands.createMany({
            data:recordsWithUUID,
            skipDuplicates: false
        })

        return uuids;
    }

    // -----------------------------------------------------------------

    static async findManyByUUID(uuids: string[]): Promise<types.Codec12Command[]> {
        const records = await prisma.codec12_commands.findMany({
            where: {
                uuid: {in: uuids}
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
    static async findById(id: bigint) {
        return prisma.codec12_commands.findUnique({
            where: { id }
        });
    }

    // Get all
    static async getAll() {
        return prisma.codec12_commands.findMany();
    }



    // ...add more custom methods as needed!
}
