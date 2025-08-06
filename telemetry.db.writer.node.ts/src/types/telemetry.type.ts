export type Telemetry = {
    timestamp: string,
    priority: number,
    longitude: number,
    latitude: number,
    altitude: number,
    angle: number,
    satellites: number,
    speed: number,
    elements: Record<string, number | string>
}


export type DeviceTelemetryUpdate = {
    device_id: string,
    last_telemetry: Telemetry,
    last_telemetry_ts: string
}