import { z } from "zod";

export const createUserSchema = z.object({
  loginName: z.string().min(1, "ログイン名を入力してください"),
  displayName: z.string().min(1, "表示名を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

export const createOrgSchema = z.object({
  name: z.string().min(1, "組織名を入力してください"),
  code: z.string().min(1, "組織コードを入力してください"),
  parentOrganizationId: z.string().optional(),
});

export const toggleUserStatusSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["activate", "deactivate"]),
});
