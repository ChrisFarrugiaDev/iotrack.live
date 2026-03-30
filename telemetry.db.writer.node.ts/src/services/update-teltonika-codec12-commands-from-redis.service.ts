import { TeltonikaCodec12Commands } from "../models/codec12Command";
import { fetchAndDeleteHsetWithLua } from "../utils/redis.utils";

export async function updateTeltonikaCodec12CommandsFromRedisService() {

    const commands = await fetchAndDeleteHsetWithLua(
        "codec12:sync-commands",
        "teltonika.parser.go:"
    );

    await TeltonikaCodec12Commands.updateCodec12CommandBulk(Object.values(commands))

    
}