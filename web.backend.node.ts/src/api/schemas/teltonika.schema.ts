import z from "zod";

// ---------------------------------------------------------------------

export const codec12ParamsSchema = z.object({
    imei: z.string().regex(/^\d{15}$/, "IMEI must be a 15-digit numeric string"),
});

export const codec12CommandSchema = z.object({
    commands: z.array(z.string().min(1), "Field is required.").min(1, "Provide at least one command."),
});

// ---------------------------------------------------------------------
