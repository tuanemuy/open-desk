import { z } from "zod";

export const addCommentSchema = z.object({
  comment: z.string().min(1, "Please enter a comment"),
});
