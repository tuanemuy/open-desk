import { z } from "zod";

export const restoreAppSchema = z.object({
  appId: z.string().min(1, "アプリIDを入力してください"),
});

export const restoreSpaceSchema = z.object({
  spaceId: z.string().min(1, "スペースIDを入力してください"),
});
