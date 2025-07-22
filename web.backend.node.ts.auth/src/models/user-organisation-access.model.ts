import { PrismaClient, user_organisation_access } from '../../generated/prisma'
import { bigIntToString } from '../utils/utils';

const prisma = new PrismaClient();

export class UserOrganisationAccess {


    //  Get all org access overrides for a given user.
    //  Returns an array (possibly empty) of override objects.   
    static async getUserOrgOverrides(userId: number | bigint | string) {
        let user_id: bigint;

        // Convert input to bigint safely
        try {
            user_id = typeof userId === 'bigint'
                ? userId
                : BigInt(userId);
        } catch (err) {
            throw new Error(`Invalid userId: ${userId}`);
        }

        const overrides = await prisma.user_organisation_access.findMany({
            where: { user_id }
        });

        // Always return an array, convert all BigInt fields to strings (recursively)
        return bigIntToString(overrides);
    }

    
}
