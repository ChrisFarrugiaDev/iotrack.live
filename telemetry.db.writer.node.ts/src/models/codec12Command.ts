import { PrismaClient, codec12_commands } from '../../generated/prisma';
import * as types from "../types/teltonika-codec-12-comand.type"



const prisma = new PrismaClient();

export class TeltonikaCodec12Commands {

    static async updateCodec12CommandBulk(
        updates: types.TeltonikaCodec12Command[]
    ) {
        if (!updates.length) return;

        const valuesSql = updates
            .map((_, i) =>
                `(
                $${i * 7 + 1}::uuid,
                $${i * 7 + 2}::text,
                $${i * 7 + 3}::timestamptz,
                $${i * 7 + 4}::timestamptz,
                $${i * 7 + 5}::text,
                $${i * 7 + 6}::integer,
                $${i * 7 + 7}::text
            )`
            )
            .join(",");

        const params = updates.flatMap((u) => [
            u.uuid,
            u.status,
            u.sent_at ?? null,
            u.responded_at ?? null,
            u.response ?? null,
            u.retries,
            u.comment ?? ""
        ]);

        const sql = `
        UPDATE teltonika.codec12_commands AS c
        SET
            status = v.status,
            sent_at = v.sent_at,
            responded_at = v.responded_at,
            response = v.response,
            retries = v.retries,
            comment = v.comment,
            updated_at = NOW()
        FROM (
            VALUES ${valuesSql}
        ) AS v(
            uuid,
            status,
            sent_at,
            responded_at,
            response,
            retries,
            comment
        )
        WHERE c.uuid = v.uuid
    `;

        await prisma.$executeRawUnsafe(sql, ...params);
    }
}