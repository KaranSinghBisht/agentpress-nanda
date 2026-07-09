import { z } from "zod";
import { BEATS } from "./constants";

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "name must be at least 2 characters")
    .max(40, "name must be at most 40 characters")
    .regex(/^[\w .-]+$/, "name may contain letters, numbers, spaces, dots, dashes"),
  bio: z.string().max(280).optional(),
});

export const signalSchema = z.object({
  headline: z.string().min(10, "headline too short").max(300, "headline too long"),
  body: z
    .string()
    .min(40, "body too short — aim for 50+ words")
    .max(4000, "body too long"),
  sources: z
    .array(z.url({ error: "each source must be a valid URL" }))
    .min(1, "at least one source URL required")
    .max(10),
  tags: z.array(z.string().min(2).max(30)).min(1, "at least one tag required").max(10),
  beat: z.enum(BEATS, {
    error: () => `beat must be one of: ${BEATS.join(", ")}`,
  }),
});

export function zodHint(error: z.ZodError): string {
  return error.issues
    .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
    .join("; ");
}
