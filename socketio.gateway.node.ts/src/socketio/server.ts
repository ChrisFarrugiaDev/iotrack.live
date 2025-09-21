import { createServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { logger } from "../utils/logger.utils";
import jwt from "jsonwebtoken";
import { Organisation } from "../models/organisation.model";
import { UserOrganisationAccess } from "../models/user-organisation-access.model";
import { UserDeviceAccess } from "../models/user-device-access.model";
import { Device } from "../models/device.model";
import { performance } from "node:perf_hooks";

// -------------------------------------------------------------------------------------------------
// - Types -----------------------------------------------------------------------------------------

type JoinAck = (joined: string[] | { error: string }) => void;

type EmitPayload = any;

// - Helper Functions ------------------------------------------------------------------------------

// returns the room name string for a device ID
function roomForDevice(deviceId: string) {
    return `device:${deviceId}`;
}

// get just the current device rooms
function getDeviceRooms(socket: Socket): string[] {
    return Array.from(socket.rooms).filter((r) => r.startsWith("device:"));
}

async function getAllowedDeviceIdsForUser(
    organisationID: string,
    userID: string
): Promise<string[]> {
    // 1) Org scope from the user's primary org
    const defaultScope = await Organisation.getOrgScope(organisationID);

    // 2) User org overrides → split into allow/deny
    const orgOverrides = await UserOrganisationAccess.getUserOrgOverrides(userID);
    const orgAllow: string[] = [];
    const orgDeny: string[] = [];

    for (const o of orgOverrides) {
        const id = String(o.organisation_id).trim();
        if (!id) continue;
        (o.is_allowed ? orgAllow : orgDeny).push(id);
    }

    // Merge to final orgIDs (ensure all are strings)
    const organisationIDs: string[] = Organisation.mergeScopeWithOverrides(
        defaultScope,
        orgAllow,
        orgDeny
    ).map(String);

    // 3) Device overrides → collect only deny IDs
    const deviceOverrides = await UserDeviceAccess.getByUserID(userID);
    const deviceDeny: string[] = deviceOverrides
        .filter((o) => !o.is_allowed)
        .map((o) => String(o.device_id).trim())
        .filter((id) => id.length > 0);

    // 4) Fetch devices for these orgs, excluding denied ones
    return await Device.getAccessibleDeviceIDs(organisationIDs, deviceDeny);
}

// - Main server factory function ------------------------------------------------------------------

export function createSocketIOServer(port: number) {
    // - Create the HTTP and Socket.IO servers ---------------------------------
    const httpServer = createServer();

    const io = new SocketIOServer(httpServer, {
        path: "/socket.io/",
        cors: {
            origin: process.env.CORS_ORIGIN || "*", // Allow all by default (configurable)
            methods: ["GET", "POST"],
            credentials: false,
        },
    });

    // - JWT middleware --------------------------------------------------------

    io.use(async (socket, next) => {
        const token =
            socket.handshake.auth?.token ||
            (socket.handshake.headers.authorization ?? "").replace(/^Bearer\s+/i, "");

        if (!token) return next(new Error("unauthorized"));

        try {
            const secret = process.env.JWT_SECRET ?? "";
            const payload = jwt.verify(token, secret) as any;
            socket.data.user = { id: payload.id, org_id: payload.org_id };

            // Fetch allowed device IDs once per connection
            const allowedDevices = await getAllowedDeviceIdsForUser(
                socket.data.user.org_id,
                socket.data.user.id
            );

            // Store in socket.data for later checks
            socket.data.allowedDevices = new Set(allowedDevices);

            next();

        } catch (err) {
            next(new Error("unauthorized"));
        }
    });

    //  - When a client connects -----------------------------------------------
    io.on("connection", (socket: Socket) => {
        logger.debug({ id: socket.id }, "socket connected");

        // - Client asks to join device rooms --------------------------
        // Client calls: socket.emit("join-devices", ["deviceId1", "deviceId2"], ack)

        socket.on("join-devices", (input: unknown, ack?: JoinAck) => {
            const t0 = performance.now();

            // Accept array or single value
            const rawList = Array.isArray(input) ? input : [input];

            // Clean: strings only, trim, remove empties
            const trimmedStrings = rawList
                .filter((item) => typeof item === "string") // Only keep strings
                .map((str) => (str as string).trim()) // Trim whitespace
                .filter((str) => str.length > 0); // Remove empty strings

            // Unique only
            const uniqueDeviceIDs = [...new Set(trimmedStrings)];

            if (uniqueDeviceIDs.length === 0) return; // nothing to join

            const maxRoomPerSocket = Number(process.env.MAX_ROOMS_PER_SOCKET ?? 500);

            // Check room count limit
            const currentRooms = getDeviceRooms(socket).length;

            // Limit: too many rooms? Reject
            if (currentRooms + uniqueDeviceIDs.length > maxRoomPerSocket) {
                if (typeof ack === "function") {
                    ack({ error: `Room limit exceeded: max ${maxRoomPerSocket}` });
                }
                return;
            }

            // Enforce ACL: intersect with allowed devices
            const allowedSet = socket.data.allowedDevices as Set<string>;
            const toJoin = uniqueDeviceIDs.filter((id) => allowedSet.has(id));

            // Join rooms
            toJoin.forEach((deviceId) => socket.join(roomForDevice(deviceId)));

            const elapsedMs = Math.round((performance.now() - t0) * 1000) / 1000;

            // Log action
            logger.debug(
                {
                    id: socket.id,
                    requested: uniqueDeviceIDs.length,
                    joined_count: toJoin.length,
                    current_rooms: currentRooms,
                    max_rooms: maxRoomPerSocket,
                    elapsed_ms: elapsedMs,
                },
                "socket joined device rooms",
            );

            // Ack with list
            ack?.(uniqueDeviceIDs);
        });

        // - Client asks to leave device rooms -------------------------
        // Client calls: socket.emit("leave-devices", ["deviceId1", "deviceId2"], ack)

        socket.on("leave-devices", (input: unknown, ack?: JoinAck) => {
            // Accept array or single value
            const rawList = Array.isArray(input) ? input : [input];

            // Clean: strings only, trim, remove empties
            const trimmedStrings = rawList
                .filter((item) => typeof item === "string")
                .map((str) => (str as string).trim())
                .filter((str) => str.length > 0);

            // Unique only
            const uniqueDeviceIDs = [...new Set(trimmedStrings)];

            if (uniqueDeviceIDs.length === 0) return; // nothing to leave

            // Leave rooms
            uniqueDeviceIDs.forEach((deviceId) => socket.leave(roomForDevice(deviceId)));

            // Log and ack
            logger.debug({ id: socket.id, left: uniqueDeviceIDs.length }, "left device rooms");
            ack?.(uniqueDeviceIDs);
        });

        // - Client disconnects ----------------------------------------
        socket.on("disconnect", (reason) => {
            logger.debug({ id: socket.id, reason }, "socket disconnected");
        });
    });

    // - Start the HTTP/Socket.IO server ---------------------------------------
    httpServer.listen(port, () => {
        logger.info(`Socket.IO listening on :${port}`);
    });

    // Facade: helper methods to emit events to device rooms from elsewhere in your app
    return {
        // Emit to a single device ID room
        emitToDevice(deviceId: string, event: string, payload: EmitPayload) {
            if (typeof deviceId !== "string" || deviceId.trim().length < 1) return;
            io.to(roomForDevice(deviceId)).emit(event, payload);
        },

        // Emit to multiple device ID rooms at once
        emitToDevices(deviceIds: string[], event: string, payload: EmitPayload) {
            const rooms = (deviceIds || [])
                .map((u) => (typeof u === "string" ? u.trim() : ""))
                .filter((u) => u.length > 0)
                .map(roomForDevice);

            if (rooms.length === 0) return;
            io.to(rooms).emit(event, payload);
        },

        // Shutdown server
        close() {
            io.close();
            httpServer.close();
        },
    };
}
