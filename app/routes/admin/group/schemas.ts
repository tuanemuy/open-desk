import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(1, "グループ名を入力してください"),
  code: z.string().min(1, "グループコードを入力してください"),
});

export const deleteGroupSchema = z.object({
  groupId: z.string().min(1),
});
