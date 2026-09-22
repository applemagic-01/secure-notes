import { hashShareToken } from "@/lib/share/token";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@/generated/prisma/client";

export async function findShareByToken(token: string, db: PrismaClient = prisma,) {
    const tokenHash = hashShareToken(token);

    return db.shareLink.findUnique({
        where: {
            tokenHash,
        },
        select: {
            id: true,
            noteId: true,
            shareType: true,
            accessType: true,
            passwordHash: true,
            expiresAt: true,
            revokedAt: true,
            usedAt: true,
            viewCount: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}

export async function getSharedNote(noteId: string, db: PrismaClient = prisma,) {
    return db.note.findUnique({
        where: {
            id: noteId,
        },
        select: {
            title: true,
            content: true,
        },
    });
}

export async function consumeOneTimeShare(shareId: string, db: PrismaClient = prisma,) {
    return db.$transaction(async (tx) => {
        const claimed = await tx.shareLink.updateMany({
            where: {
                id: shareId,
                usedAt: null,
                revokedAt: null,
                OR: [
                    {
                        expiresAt: null,
                    },
                    {
                        expiresAt: {
                            gt: new Date(),
                        },
                    },
                ],
            },
            data: {
                usedAt: new Date(),
                viewCount: {
                    increment: 1,
                },
            },
        });

        if (claimed.count !== 1) {
            return false;
        }

        await tx.viewEvent.create({
            data: {
                shareLinkId: shareId,
            },
        });

        return true;
    });
}


export async function recordTimeBasedView(shareId: string, db: PrismaClient = prisma,) {
    return db.$transaction(async (tx) => {
        const now = new Date();

        const updated = await tx.shareLink.updateMany({
            where: {
                id: shareId,
                revokedAt: null,
                expiresAt: {
                    gt: now,
                },
            },
            data: {
                viewCount: {
                    increment: 1,
                },
            },
        });

        if (updated.count !== 1) {
            return false;
        }

        await tx.viewEvent.create({
            data: {
                shareLinkId: shareId,
            },
        });

        return true;
    });
}