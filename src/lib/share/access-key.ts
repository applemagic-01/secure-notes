import crypto from "crypto";
import argon2 from "argon2";

export function generateAccessKey() {
    const bytes = crypto.randomBytes(9);

    return bytes
        .toString("base64url")
        .slice(0, 12)
        .toUpperCase();
}

export async function hashAccessKey(accessKey: string) {
    return argon2.hash(accessKey, {
        type: argon2.argon2id,
    });
}

export async function verifyAccessKey(
    accessKey: string,
    passwordHash: string,
) {
    return argon2.verify(passwordHash, accessKey);
}