import z from "zod";

// ------------------------------------------------------------------
// Reusable string with required/invalid error messages

const requiredString = z.string({
  error: (iss) => iss.input === undefined
    ? "Field is required."
    : "Invalid input."
});

// A numeric string validator (string that must contain digits only)
const numericString = requiredString.regex(/^\d+$/, "Must be numeric");

// ------------------------------------------------------------------
// Device Schemas

export const destroySchema = z.object({
  device_ids: z.array(numericString, "Field is required.")
});

export const storeSchema = z.object({
  organisation_id: numericString.optional(),
  external_id: requiredString,
  external_id_type: requiredString,
  protocol: requiredString,
  vendor: requiredString,
  model: requiredString,
  status: requiredString,
  attributes: z.record(z.string(), z.any()),
});
