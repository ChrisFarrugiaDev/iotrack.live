import { Device } from "../models/device.model";
import { DeviceTelemetryUpdate, Telemetry } from "../types/telemetry.type";
import * as redisUtils from "../utils/redis.utils";


// Fetches latest telemetry data for all device IDs from Redis,
// prepares bulk updates, and writes them to the database in a single operation.

export async function updateAllDevicesLastTelemetryFromRedisService() {
    // Fetch all device IDs with telemetry updates and remove them from Redis set
    const deviceIds = await redisUtils.smembersAndDeleteWithLua(
        "device-latest-telemetry:id",
        "teltonika.parser.go:"
    );

    // Build the array of updates for bulk DB operation
    const telemetryUpdates: DeviceTelemetryUpdate[] = [];

    for (const id of deviceIds) {
        if (typeof id === "string") {
            // Get latest telemetry object for this device from Redis
            const telemetry = await redisUtils.get(
                `device-latest-telemetry:${id}`,
                "teltonika.parser.go:"
            ) as Telemetry;

            // Defensive: check that telemetry and timestamp exist
            if (telemetry && telemetry.timestamp) {
                telemetryUpdates.push({
                    device_id: id,
                    last_telemetry: telemetry,
                    last_telemetry_ts: telemetry.timestamp
                });
            }
        }
    }

    // Bulk update all devices in the DB, if there are any to update
    if (telemetryUpdates.length > 0) {
        await Device.updateDeviceTelemetryBulk(telemetryUpdates);
    }
}
