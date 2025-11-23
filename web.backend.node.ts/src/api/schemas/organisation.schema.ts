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

//----------------------------------------------------------------------
// Field validators

// Non-empty string: trims and requires at least 1 char
const nonEmptyString = requiredString.trim().min(1, "Required");

// Numeric string: must be digits only
const numericString = requiredString.regex(/^\d+$/, "Must be numeric");

//----------------------------------------------------------------------
// Main user store schema

export const storeSchema = z.object({

    name: nonEmptyString,
    parent_org_id: numericString,
    maps_api_key: nonEmptyString.optional(),
    can_inherit_key: requiredBoolean, 

});