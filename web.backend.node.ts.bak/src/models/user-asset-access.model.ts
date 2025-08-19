import { user_asset_access } from '../../generated/prisma';
import { bigIntToString } from '../utils/utils';

import prisma from '../config/prisma.config';

export class UserAssetAccess {

    static async getByUserID (userID: string) {

        const assetAccess = await prisma.user_asset_access.findMany({
            where: {'user_id': BigInt(userID)}
        });

        // Always return an array, convert all BigInt fields to strings (recursively)
        return bigIntToString(assetAccess);
    }
}