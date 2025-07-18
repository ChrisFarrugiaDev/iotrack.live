import { PrismaClient, users, organisations } from '../../generated/prisma'

const prisma = new PrismaClient();

export class Organisation{

    static async getById(id: string) {
        const organisations = await prisma.organisations.findUnique({
            where: { id: BigInt(id)}
        });

        if (organisations) {
            return {...organisations, id: organisations.id.toString() }
        }

        return null;
    }
}