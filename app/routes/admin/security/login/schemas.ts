import { z } from "zod";

export const passwordComplexityValues = [
  "NONE",
  "ALPHANUMERIC",
  "ALPHANUMERIC_SPECIAL",
] as const;

export const saveSecuritySchema = z.object({
  // SAML Auth
  samlEnabled: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  // Two Factor Auth
  twoFactorEnabled: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  // Password Policy
  userPasswordMinLength: z.coerce.number().int().min(3).max(15),
  adminPasswordMinLength: z.coerce.number().int().min(3).max(15),
  complexity: z.enum(passwordComplexityValues),
  // Lockout Policy
  lockoutAttempts: z.coerce.number().int().min(0).max(10),
  lockoutDuration: z.string(),
  // Session Policy
  sessionTimeout: z.string(),
});
