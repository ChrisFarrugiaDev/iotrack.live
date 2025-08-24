import { z } from "zod";

// ------------------------------------------------------------------

const passwordSchema = z
  .string({
    error: (iss) => iss.input === undefined
      ? "Field is required."
      : "Invalid input.."
  })
  .min(8, { message: "Password must be at least 8 characters." })
  .max(20, { message: "Password must be at most 20 characters." })
  .refine((v: string) => /[A-Z]/.test(v), { message: "Password must include an uppercase letter." })
  .refine((v: string) => /[a-z]/.test(v), { message: "Password must include a lowercase letter." })
  .refine((v: string) => /[0-9]/.test(v), { message: "Password must include a digit." })
  .refine((v: string) => /[!@#$%^&*]/.test(v), { message: "Password must include a special character (!@#$%^&*)." });

const emailSchema = z
  .string({
    error: (iss) => iss.input === undefined
      ? "Field is required."
      : "Invalid input..."
  })
  .email({ message: "Invalid email address." });

const requiredString = z.string({
  error: (iss) => iss.input === undefined
    ? "Field is required."
    : "Invalid input!"
});


// ------------------------------------------------------------------
//  Login Schemas


export const loginSchema = z.object({
  password: requiredString.min(3, { message: "Password must be at least 3 characters." }),
  email: requiredString.min(3, { message: "Password must be at least 3 characters." }),
});
