import { FastifyInstance } from "fastify";
import authRouter from "./auth.router";
import teltonikaRouter from "./teltonika.router";
import accessProfileRouter from "./access-profile.router";
import deviceRouter from "./device.router";
import assetRouter from "./asset.router";
import userRouter from "./user.router";
import organisationRoute from "./organisation.router";

// ---------------------------------------------------------------------

// Fastify uses plugin registration instead of .use
export default async function router(fastify: FastifyInstance) {
    await fastify.register(authRouter, { prefix: "/auth" });
    await fastify.register(teltonikaRouter, { prefix: "/teltonika" });
    await fastify.register(accessProfileRouter, { prefix: "/access-profile" });
    await fastify.register(deviceRouter, { prefix: "/device" });
    await fastify.register(assetRouter, {prefix: '/asset'});
    await fastify.register(userRouter, {prefix: '/user'});
    await fastify.register(organisationRoute, {prefix: '/organisation'});
}

// ---------------------------------------------------------------------
