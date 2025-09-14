import { Organisation } from "../models/organisation.model";
import * as redisUtils from "../utils/redis.utils";


export async function cacheAllOrganisationsToRedis(): Promise<void> {
    const organisations = await Organisation.getAll();

    const orgMap = organisations.reduce((acc, org) => {
        acc[org.id] = org; 
        return acc;
    }, {} as Record<string, any>);

    await redisUtils.replaceHsetWithLua('organisations', orgMap, 'iotrack.live:');
}