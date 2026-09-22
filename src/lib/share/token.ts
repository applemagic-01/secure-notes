import crypto from "crypto";

// 32 random bytes provide 256 bits of entropy, making URL guessing impractical.
export function generateShareToken() {
    return crypto.randomBytes(32).toString("base64url");
}

// The raw token is returned only when the link is created; the database stores its hash.
export function hashShareToken(token: string) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}