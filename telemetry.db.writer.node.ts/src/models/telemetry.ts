import {PrismaClient, telemetry} from '../../generated/prisma'

export class Telemetry {
    static async create() {

    }

    static async createBulk(records: Array <Omit<telemetry, 'id' | 'uuid' | 'created_at'  > >) {

    }
}