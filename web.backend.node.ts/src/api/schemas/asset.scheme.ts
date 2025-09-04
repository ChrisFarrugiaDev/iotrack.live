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


const assetTypeSchima = z.enum(["vehicle", "personal", "asset"], {
		error: (iss) => "Invalid input."
});

const nonEmptyString = requiredString.trim().min(1, "Required");

// ------------------------------------------------------------------
// Asset Schemas

export const destroySchema = z.object({
	asset_ids: z.array(numericString, "Field is required.").min(1, "Provide at least one asset id.")
});
export type AssetDestroyBody = z.infer<typeof destroySchema>;

// name, asset_type, organisation_id, asset_id 
export const storeSchema = z.object({
	organisation_id: numericString,
	device_id: nonEmptyString.optional(),
	name: requiredString,
	asset_type: assetTypeSchima,
	attributes: z.record(z.string(), z.any()),
});

export const updateSchema = z.object({
	organisation_id: numericString.optional(),
	device_id: nonEmptyString.optional(),
	name: requiredString.optional(),
	asset_type: assetTypeSchima.optional(),
	attributes: z.record(z.string(), z.any()).optional(),	
	
})
.refine((data) => Object.keys(data).length > 0, {
	message: "At least one field must be provided to update.",
});

export type AssetStoreBody = z.infer<typeof storeSchema>;




