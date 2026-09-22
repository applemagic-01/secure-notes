import { z } from "zod";

export const createShareSchema = z
    .object({
        shareType: z.enum(["ONE_TIME", "TIME_BASED"]),

        accessType: z.enum(["PUBLIC", "PASSWORD"]),

        expiresAt: z.string().datetime().optional(),

        accessKey: z
            .string()
            .min(8, "Access key must be at least 8 characters")
            .max(128, "Access key must be at most 128 characters")
            .optional(),
    })
    .superRefine((data, ctx) => {
        if (data.shareType === "TIME_BASED" && !data.expiresAt) {
            ctx.addIssue({
                code: "custom",
                path: ["expiresAt"],
                message: "Expiry date is required for time-based shares",
            });
        }

        if (data.shareType === "ONE_TIME" && data.expiresAt) {
            ctx.addIssue({
                code: "custom",
                path: ["expiresAt"],
                message: "Expiry date is not used for one-time shares",
            });
        }

        if (data.accessType === "PASSWORD" && !data.accessKey) {
            ctx.addIssue({
                code: "custom",
                path: ["accessKey"],
                message: "Access key is required for password-protected shares",
            });
        }

        if (data.accessType === "PUBLIC" && data.accessKey) {
            ctx.addIssue({
                code: "custom",
                path: ["accessKey"],
                message: "Access key is only used for password-protected shares",
            });
        }
    });