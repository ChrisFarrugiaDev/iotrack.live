import { user_device_access } from '../../generated/prisma';
import { bigIntToString } from '../utils/utils';

import prisma from '../config/prisma.config';


export type UserDeviceAccessType =  {
    user_id: string;
    device_id: string;
    is_allowed: string;
};

export class UserDeviceAccess {

    static async getByUserID (userID: string): Promise<UserDeviceAccessType[]> {

        const result = await prisma.user_device_access.findMany({
            where: {'user_id': BigInt(userID)}
        });

        // Always return an array, convert all BigInt fields to strings (recursively)
        return bigIntToString(result);
    }
}