import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const SESSION_DURATION_DAYS = 7;

export function generateSessionToken() {
    return crypto.randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}

export function getSessionExpiry() {
    const expiry = new Date();

    expiry.setDate(expiry.getDate() + SESSION_DURATION_DAYS);

    return expiry;
}

export async function createSession(userId: string) {
    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = getSessionExpiry();

    const session = await prisma.session.create({
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

export async function deleteSession(token: string) {
    const tokenHash = hashSessionToken(token);

    await prisma.session.deleteMany({
        where: {
            tokenHash,
        },
    });
}


export async function getSessionUser(token: string) {
    const tokenHash = hashSessionToken(token);

    const session = await prisma.session.findUnique({
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

    if (session.expiresAt <= new Date()) {
        await prisma.session.delete({
            where: {
                id: session.id,
            },
        });

        return null;
    }

    return session.user;
}

export async function getAuthenticatedUser(token: string | undefined) {
    if (!token) {
        return null;
    }

    return getSessionUser(token);
}