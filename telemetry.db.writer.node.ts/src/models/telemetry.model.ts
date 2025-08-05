
import { Prisma } from '../../generated/prisma';
import prisma from '../config/prisma.config';


export class Telemetry {


    static async createBulk(records: Array<Omit<Prisma.telemetryCreateManyInput, 'id' | 'created_at'> >) {

        await prisma.telemetry.createMany({
            data:records,
            skipDuplicates: false,
        });       
    }
}