import argon2 from "argon2";

// Passwords are never stored as plain text. Argon2id is intentionally slow
// and memory-hard, which makes offline password guessing more expensive.
export async function hashPassword(password: string) {
    return argon2.hash(password, {
        type: argon2.argon2id,
    });
}

// Argon2 verifies the submitted password against the stored hash.
export async function verifyPassword(
    passwordHash: string,
    password: string,
) {
    return argon2.verify(passwordHash, password);
}
