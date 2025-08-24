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


const statusSchima = z.enum(["active", "inactive", "suspended"]);
const externalIdTypeSchima = z.enum(["imei", "serial", "vin", "eui"], {
		error: (iss) => "Invalid input."
});

// ------------------------------------------------------------------
// Device Schemas

export const destroySchema = z.object({
	device_ids: z.array(numericString, "Field is required.").min(1, "Provide at least one device id.")
});

export const storeSchema = z.object({
	organisation_id: numericString,
	asset_id: numericString.optional(),
	external_id: requiredString,
	external_id_type: externalIdTypeSchima,
	protocol: requiredString,
	vendor: requiredString,
	model: requiredString,
	status:  statusSchima,
	attributes: z.record(z.string(), z.any()),
});

export const updateSchema = storeSchema
	.partial()
	.refine(
		(data) => Object.keys(data).length > 0,
		{ message: "At least one field must be provided to update." }
	);


export const getSchema = z.object({
  id: z.string().regex(/^\d+$/, "Device id must be numeric"),
});
