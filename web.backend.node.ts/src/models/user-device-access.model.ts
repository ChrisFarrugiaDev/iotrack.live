import { user_device_access } from '../../generated/prisma';
import { bigIntToString } from '../utils/utils';

import prisma from '../config/prisma.config';

export class UserDeviceAccess {

    static async getByUserID (userID: string) {

        const result = await prisma.user_device_access.findMany({
            where: {'user_id': BigInt(userID)}
        });

        // Always return an array, convert all BigInt fields to strings (recursively)
        return bigIntToString(result);
    }
}