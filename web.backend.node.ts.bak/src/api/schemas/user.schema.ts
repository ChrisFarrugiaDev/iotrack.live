import z from "zod";

//----------------------------------------------------------------------
// Basic required field validators


// Required string with custom error messages
const requiredString = z.string({
    error: (iss) => iss.input === undefined
        ? "Field is required."
        : "Invalid input."
});

// Required boolean with custom error messages
const requiredBoolean = z.boolean({
    error: (iss) => iss.input === undefined
        ? "Field is required."
        : "Invalid input."
});

// Required number with custom error messages
const requiredNumber = z.number({
    error: (iss) => iss.input === undefined
        ? "Field is required."
        : "Invalid input."
});

//----------------------------------------------------------------------
// Field validators


// Email field: trims, checks valid format, and required
const emailField = z
    .email({ message: "Invalid email format." })
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, { message: "Email is required." });

// Numeric string: must be digits only
const numericString = requiredString.regex(/^\d+$/, "Must be numeric");

// Non-empty string: trims and requires at least 1 char
const nonEmptyString = requiredString.trim().min(1, "Required");

// Record type: keys are numeric strings, values are booleans
const booleanRecord = z.record(
    z.string().regex(/^\d+$/, "Keys must be numeric"),
    z.boolean()
);

//----------------------------------------------------------------------
// Main user store schema


export const storeSchema = z.object({
    first_name: nonEmptyString,                      // User's first name (required, non-empty)
    last_name: nonEmptyString,                       // User's last name (required, non-empty)
    email: emailField,                               // Email (required, format-checked)
    password: nonEmptyString.optional(),             // Password (optional, but if provided: non-empty)
    role: requiredNumber,                            // User role (required, number)
    active: requiredBoolean,                         // Active flag (required, boolean)
    organisation_id: numericString,                  // Organisation ID (required, numeric string)
    user_permissions: booleanRecord,                 // Permission map: { [perm_id]: boolean }
    user_organisation_access: booleanRecord,         // Org access map: { [org_id]: boolean }
    user_asset_access: booleanRecord,                // Asset access map: { [asset_id]: boolean }
    user_device_access: booleanRecord,               // Device access map: { [device_id]: boolean }
});


export const destroySchema = z.object({
    user_ids: z.array(numericString, "Field is required.").min(1, "Provide at least one user id.")
});



export const updateSchema = z.object({

    first_name: nonEmptyString.optional(),                     
    last_name: nonEmptyString.optional(),                     
    email: emailField.optional(),                              
    password: nonEmptyString.optional().optional(),         
    role: requiredNumber.optional(),                          
    active: requiredBoolean.optional(),                
    organisation_id: numericString.optional(),              
    user_permissions: booleanRecord.optional(),               
    user_organisation_access: booleanRecord.optional(),       
    user_asset_access: booleanRecord.optional(),            
    user_device_access: booleanRecord.optional(),             

}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
});