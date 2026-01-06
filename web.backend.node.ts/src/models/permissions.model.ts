import prisma from '../config/prisma.config';
import * as redisUtils from "../utils/redis.utils";

export class Permissions {


    static async getAll() {
        const permissions = await prisma.permissions.findMany();

        return permissions;
    }

    static async getIdToKeyMap(): Promise<Map<number, string>> {
        const cacheKey = "permissions:id-to-key";

        const cached = await redisUtils.get(cacheKey, "iotrack.live:");
        if (cached) {
            return new Map<number, string>(cached);
        }

        const perms = await prisma.permissions.findMany({
            select: { perm_id: true, key: true },
        });

        const map = new Map(
            perms.map(p => [Number(p.perm_id), p.key])
        );

        await redisUtils.set(
            cacheKey,
            JSON.stringify([...map.entries()]),
            3600,
            "iotrack.live:"
        );

        return map;
    }
}