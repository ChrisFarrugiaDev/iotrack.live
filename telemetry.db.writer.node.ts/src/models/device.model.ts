import { devices } from "../../generated/prisma";
import prisma from '../config/prisma.config';
import { DeviceTelemetryUpdate } from "../types/telemetry.type";



export type DeviceType = Omit<devices, 'id'> & {
    id: string
}



export class Device {

    static async updateDeviceTelemetryBulk(updates: DeviceTelemetryUpdate[]) {

        if (!updates.length) return;

        // Build SQL values string and params array for parameterized query
        const valuesSql = updates
            .map((_, i) =>
                `($${i * 3 + 1}::bigint, $${i * 3 + 2}::jsonb, $${i * 3 + 3}::timestamptz)`
            )
            .join(',');

        const params = updates.flatMap(u => [
            Number(u.device_id), // device_id (int)
            JSON.stringify(u.last_telemetry), // last_telemetry (jsonb)
            u.last_telemetry_ts // timestamp (string)
        ]);

        const sql = `
    UPDATE app.devices AS d
    SET
      last_telemetry = v.last_telemetry,
      last_telemetry_ts = v.last_telemetry_ts,
      updated_at = NOW()
    FROM (VALUES ${valuesSql}) AS v(device_id, last_telemetry, last_telemetry_ts)
    WHERE d.id = v.device_id
  `;

        await prisma.$executeRawUnsafe(sql, ...params); // Use $executeRawUnsafe for dynamic 
    }
}