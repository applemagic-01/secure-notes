import argon2 from "argon2";

export async function hashAccessKey(accessKey: string) {
    return argon2.hash(accessKey, {
        type: argon2.argon2id,
    });
}

export async function verifyAccessKey(
    accessKeyHash: string,
    accessKey: string,
) {
    return argon2.verify(accessKeyHash, accessKey);
}