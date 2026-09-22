import crypto from "crypto";
import argon2 from "argon2";

// Password-protected shares receive a server-generated secret instead of a user-chosen key.\nexport function generateAccessKey() {
    const bytes = crypto.randomBytes(9);

    return bytes
        .toString("base64url")
        .slice(0, 12)
        .toUpperCase();
}

// The access key is treated like a password, so only its Argon2id hash is persisted.\nexport async function hashAccessKey(accessKey: string) {
    return argon2.hash(accessKey, {
        type: argon2.argon2id,
    });
}

// Verification compares the submitted key with the stored Argon2id hash.\nexport async function verifyAccessKey(
    accessKey: string,
    passwordHash: string,
) {
    return argon2.verify(passwordHash, accessKey);
}