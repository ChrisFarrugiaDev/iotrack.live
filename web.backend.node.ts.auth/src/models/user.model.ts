import { PrismaClient, users, organisations } from '../../generated/prisma'

const prisma = new PrismaClient();

export class User {

    static async getByEmail(email: string) {
        const user = await prisma.users.findUnique({
            where: { email }
        });

        if (user) {
            return {...user, id: user.id.toString()}
        }

        return null;
    }
}