import { z } from "zod";

export const updateHeaderColorSchema = z.object({
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "有効なHEXカラーコードを入力してください"),
});
