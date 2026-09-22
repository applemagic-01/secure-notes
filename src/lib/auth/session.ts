import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@/generated/prisma/client";

// Sessions are intentionally short-lived. The browser must authenticate again after this window.
const SESSION_DURATION_DAYS = 7;

// The raw token is kept in the browser cookie; only its hash is stored in PostgreSQL.
export function generateSessionToken() {
    return crypto.randomBytes(32).toString("base64url");
}

// Hashing means a database leak does not directly reveal a usable session cookie.
export function hashSessionToken(token: string) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}

export function getSessionExpiry() {
    const expiry = new Date();

    expiry.setDate(
        expiry.getDate() + SESSION_DURATION_DAYS,
    );

    return expiry;
}

export async function createSession(
    userId: string,
    db: PrismaClient = prisma,
) {
    const token = generateSessionToken();

    const tokenHash = hashSessionToken(token);

    const expiresAt = getSessionExpiry();

    // Store only the hash. The raw token is returned once so the route can set the cookie.
    const session = await db.session.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
        },
    });

    return {
        session,
        token,
    };
}

export async function deleteSession(
    token: string,
    db: PrismaClient = prisma,
) {
    const tokenHash = hashSessionToken(token);

    await db.session.deleteMany({
        where: {
            tokenHash,
        },
    });
}

export async function getSessionUser(
    token: string,
    db: PrismaClient = prisma,
) {
    const tokenHash = hashSessionToken(token);

    const session = await db.session.findUnique({
        where: {
            tokenHash,
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    createdAt: true,
                },
            },
        },
    });

    if (!session) {
        return null;
    }

    // Expiry is enforced on the server, not by trusting the browser clock.
    if (session.expiresAt <= new Date()) {
        await db.session.delete({
            where: {
                id: session.id,
            },
        });

        return null;
    }

    return session.user;
}

export async function getAuthenticatedUser(
    token: string | undefined,
    db: PrismaClient = prisma,
) {
    if (!token) {
        return null;
    }

    return getSessionUser(token, db);
}