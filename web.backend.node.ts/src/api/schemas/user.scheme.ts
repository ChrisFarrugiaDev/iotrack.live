import z from "zod";


const requiredString = z.string({
    error: (iss) => iss.input === undefined
        ? "Field is required."
        : "Invalid input."
});

const requiredBoolen = z.boolean({
    error: (iss) => iss.input === undefined
        ? "Field is required."
        : "Invalid input."
});
const requiredNumber = z.number({
    error: (iss) => iss.input === undefined
        ? "Field is required."
        : "Invalid input."
});

const numericString = requiredString.regex(/^\d+$/, "Must be numeric");


const nonEmptyString = requiredString.trim().min(1, "Required");



const booleanRecord = z.record(
  z.string().regex(/^\d+$/, "Keys must be numeric"),
  z.boolean()
);

export const storeSchema = z.object({
    first_name: nonEmptyString,
    last_name: nonEmptyString,
    email: nonEmptyString,
    password: nonEmptyString.optional(),
    role: requiredNumber,
    active:requiredBoolen,
    organisation_id: numericString,
    user_permissions: booleanRecord ,
    user_organisation_access: booleanRecord,
    user_asset_access: booleanRecord,
    user_device_access: booleanRecord,

});