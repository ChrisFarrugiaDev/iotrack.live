import z from "zod";

// ------------------------------------------------------------------
// Reusable string with required/invalid error messages

const requiredString = z.string({
	error: (iss) => iss.input === undefined
		? "Field is required."
		: "Invalid input."
});


const nonEmptyString = requiredString.trim().min(1, "Required");

// A numeric string validator (string that must contain digits only)
const numericString = requiredString.regex(/^\d+$/, "Must be numeric");


const statusSchima = z.enum(["active", "inactive", "suspended"], {
	error: (iss) => iss.input === undefined
		? "Field is required."
		: "Invalid input."
});


const externalIdTypeSchima = z.enum(["imei", "serial", "vin", "eui"], {
	error: (iss) => iss.input === undefined
		? "Field is required."
		: "Invalid input."
});

// ------------------------------------------------------------------
// Device Schemas

export const destroySchema = z.object({
	device_ids: z.array(numericString, "Field is required.").min(1, "Provide at least one device id.")
});

// store (create) schema — all required
export const storeSchema = z.object({
	organisation_id: numericString,
	asset_id: numericString.optional().nullable(), // allow null to mean detach later (if you want)
	external_id: nonEmptyString,
	external_id_type: externalIdTypeSchima,        // consider z.enum([...]) if you have finite types
	protocol: nonEmptyString,                 // consider z.enum(['4G'])
	vendor: nonEmptyString,
	model: nonEmptyString,
	status: statusSchima,                   // consider z.enum(['active','disabled','retired','new'])
	attributes: z.record(z.string(), z.any()).default({}),
});

// update schema — all optional BUT if present must be non-empty (except asset_id which can be null to detach)
export const updateSchema = z.object({
		organisation_id: numericString.optional(),
		asset_id: numericString.optional().nullable(),      // nullable allowed → detach
		external_id: nonEmptyString.optional(),
		external_id_type: externalIdTypeSchima.optional(),
		protocol: nonEmptyString.optional(),
		vendor: nonEmptyString.optional(),
		model: nonEmptyString.optional(),
		status: statusSchima.optional(),
		attributes: z.record(z.string(), z.any()).optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided to update",
	});


export const getSchema = z.object({
	id: z.string().regex(/^\d+$/, "Device id must be numeric"),
});
