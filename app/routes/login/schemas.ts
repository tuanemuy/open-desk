import { z } from "zod";

export const loginSchema = z.object({
  loginName: z.string().min(1, "Please enter your email address"),
  password: z.string().min(1, "Please enter your password"),
});
