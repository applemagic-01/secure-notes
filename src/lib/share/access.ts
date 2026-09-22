import { hashShareToken } from "@/lib/share/token";
import { prisma } from "@/lib/prisma";

export async function findShareByToken(token: string) {
    const tokenHash = hashShareToken(token);

    return prisma.shareLink.findUnique({
        where: {
            tokenHash,
        },
        include: {
            note: {
                select: {
                    id: true,
                    title: true,
                    content: true,
                },
            },
        },
    });
}

export async function consumeOneTimeShare(shareId: string) {
    return prisma.$transaction(async (tx) => {
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


export async function recordTimeBasedView(shareId: string) {
    return prisma.$transaction(async (tx) => {
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