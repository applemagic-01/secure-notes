import type { Context } from "hono";

// Rate limiting needs a stable client identifier, usually supplied by the proxy.\nexport function getClientIp(c: Context) {
    const forwardedFor = c.req.header("X-Forwarded-For");

    // X-Forwarded-For can contain a proxy chain; the first address is the original client.\n    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    return c.req.header("X-Real-IP") ?? "unknown";
}