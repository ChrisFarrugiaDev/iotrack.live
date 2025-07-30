
import { PrismaClient, Prisma } from '../../generated/prisma';
const prisma = new PrismaClient();

export class Telemetry {


    static async createBulk(records: Array<Omit<Prisma.telemetryCreateManyInput, 'id' | 'created_at'> >) {

        await prisma.telemetry.createMany({
            data:records,
            skipDuplicates: false,
        });       
    }
}