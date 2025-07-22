import { PrismaClient, user_asset_access } from '@root/generated/prisma'
import { bigIntToString } from '../utils/utils';

const prisma = new PrismaClient();

export class UserAssetAccess {

    static async getByUserID (userID: string) {

        const assetAccess = await prisma.user_asset_access.findMany({
            where: {'user_id': BigInt(userID)}
        });

        // Always return an array, convert all BigInt fields to strings (recursively)
        return bigIntToString(assetAccess);
    }
}