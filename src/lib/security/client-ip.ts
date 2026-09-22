import type { Context } from "hono";

export function getClientIp(c: Context) {
    const forwardedFor = c.req.header("X-Forwarded-For");

    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    return c.req.header("X-Real-IP") ?? "unknown";
}