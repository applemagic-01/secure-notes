import { z } from "zod";

export const createShareSchema = z
    .object({
        shareType: z.enum(["ONE_TIME", "TIME_BASED"]),

        accessType: z.enum(["PUBLIC", "PASSWORD"]),

        expiresAt: z.string().datetime().optional(),
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
    });