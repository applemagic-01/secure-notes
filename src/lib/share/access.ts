import { hashShareToken } from "@/lib/share/token";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@/generated/prisma/client";

// Convert the raw URL token into its database hash before looking it up.\nexport async function findShareByToken(token: string, db: PrismaClient = prisma,) {
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

// Only expose the title and content to a shared viewer; owner/session fields stay private.\nexport async function getSharedNote(noteId: string, db: PrismaClient = prisma,) {
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

// This is the concurrency boundary: only one request can atomically claim a one-time link.\nexport async function consumeOneTimeShare(shareId: string, db: PrismaClient = prisma,) {
    return db.$transaction(async (tx) => {
        // usedAt, revokedAt, and expiry are checked inside the UPDATE itself.\n        const claimed = await tx.shareLink.updateMany({
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

        // Zero rows means another request already won, or the link became invalid.\n        if (claimed.count !== 1) {
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


// Time-based shares can be viewed repeatedly, but every view must still be valid at update time.\nexport async function recordTimeBasedView(shareId: string, db: PrismaClient = prisma,) {
    return db.$transaction(async (tx) => {
        const now = new Date();

        // Incrementing in the database avoids a read-modify-write lost-update problem.\n        const updated = await tx.shareLink.updateMany({
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