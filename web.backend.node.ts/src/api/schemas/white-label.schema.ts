import z from "zod";

//----------------------------------------------------------------------
// Field validators

// Optional nullable trimmed string (null clears the value)
const optionalNullableString = z.string({
    error: (iss) => iss.input === undefined
        ? "Field is required."
        : "Invalid input."
}).trim().nullable().optional();

//----------------------------------------------------------------------
// Main white label update schema

export const updateSchema = z.object({

    domain: optionalNullableString,
    app_title: optionalNullableString,
    login_bg_url: optionalNullableString,
    login_fg_url: optionalNullableString,

}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
});
