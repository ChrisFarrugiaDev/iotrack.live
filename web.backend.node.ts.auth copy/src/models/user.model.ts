import { PrismaClient, users, organisations } from '../../generated/prisma'
import { bigIntToString } from '../utils/utils';

const prisma = new PrismaClient();

// Supported user relations for eager loading in Prisma queries
type UserRelation = 'organisations' | 'roles';

export class User {
    
    // Fetches a user by email, with optional related data.
    static async getByEmail(email: string, relations?: UserRelation[]) {
        // Convert array of relation names to Prisma's expected include object
        const includeObj = relations
            ? Object.fromEntries(relations.map(relation => [relation, true]))
            : undefined;

        // Query user by email, with optional relations included
        const user = await prisma.users.findUnique({
            where: { email },
            include: includeObj, // e.g., include: { organisations: true }
        });

        // If found, convert all BigInt fields to strings (recursively)
        if (user) {
            return bigIntToString(user);
        }

        // Return null if not found
        return null;
    }
}
