import { z } from "zod";

export const updateMailSettingsSchema = z.object({
  fromAddress: z.string().min(1, "送信元アドレスを入力してください"),
  serverType: z.enum(["BUILTIN", "EXTERNAL"]),
  externalHost: z.string().optional(),
  externalPort: z.coerce.number().int().positive().optional(),
  externalUsername: z.string().optional(),
  externalPassword: z.string().optional(),
  externalUseTls: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});
