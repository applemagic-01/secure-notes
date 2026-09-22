import { beforeEach, describe, expect, it } from "vitest";

import { testPrisma } from "./helpers/test-db";

import {
    consumeOneTimeShare,
    recordTimeBasedView,
} from "@/lib/share/access";

import {
    hashAccessKey,
    generateAccessKey,
    verifyAccessKey,
} from "@/lib/share/access-key";

import { createShareApp } from "@/app/api/[[...route]]/route";

import { generateShareToken, hashShareToken } from "@/lib/share/token";




describe("one-time share concurrency", () => {
    beforeEach(async () => {
        await testPrisma.viewEvent.deleteMany();
        await testPrisma.shareLink.deleteMany();
        await testPrisma.note.deleteMany();
        await testPrisma.user.deleteMany();
    });

    it("allows exactly one successful consumption", async () => {
        const user = await testPrisma.user.create({
            data: {
                email: "concurrency-test@example.com",
                passwordHash: "test-password-hash",
            },
        });

        const note = await testPrisma.note.create({
            data: {
                userId: user.id,
                title: "Concurrency Test Note",
                content: "This note should only be viewed once.",
            },
        });

        const share = await testPrisma.shareLink.create({
            data: {
                noteId: note.id,
                tokenHash: "concurrency-test-token",
                shareType: "ONE_TIME",
                accessType: "PUBLIC",
            },
        });

        const attempts = await Promise.all(
            Array.from({ length: 10 }, () =>
                consumeOneTimeShare(share.id, testPrisma),
            ),
        );

        const successfulAttempts = attempts.filter(Boolean);

        expect(successfulAttempts).toHaveLength(1);

        const updatedShare = await testPrisma.shareLink.findUnique({
            where: {
                id: share.id,
            },
        });

        expect(updatedShare?.usedAt).not.toBeNull();
        expect(updatedShare?.viewCount).toBe(1);

        const viewEvents = await testPrisma.viewEvent.count({
            where: {
                shareLinkId: share.id,
            },
        });

        expect(viewEvents).toBe(1);
    });

});


it("rejects an already-used one-time share", async () => {
    const user = await testPrisma.user.create({
        data: {
            email: "used-test@example.com",
            passwordHash: "test-password-hash",
        },
    });

    const note = await testPrisma.note.create({
        data: {
            userId: user.id,
            title: "Used Share Test",
            content: "This should not be accessible twice.",
        },
    });

    const share = await testPrisma.shareLink.create({
        data: {
            noteId: note.id,
            tokenHash: "used-share-token",
            shareType: "ONE_TIME",
            accessType: "PUBLIC",
            usedAt: new Date(),
            viewCount: 1,
        },
    });

    const result = await consumeOneTimeShare(share.id, testPrisma);

    expect(result).toBe(false);

    const updatedShare = await testPrisma.shareLink.findUnique({
        where: {
            id: share.id,
        },
    });

    expect(updatedShare?.viewCount).toBe(1); 
});

it("rejects a revoked one-time share", async () => {
    const user = await testPrisma.user.create({
        data: {
            email: "revoked-test@example.com",
            passwordHash: "test-password-hash",
        },
    });

    const note = await testPrisma.note.create({
        data: {
            userId: user.id,
            title: "Revoked Share Test",
            content: "This should no longer be accessible.",
        },
    });

    const share = await testPrisma.shareLink.create({
        data: {
            noteId: note.id,
            tokenHash: "revoked-share-token",
            shareType: "ONE_TIME",
            accessType: "PUBLIC",
            revokedAt: new Date(),
        },
    });

    const result = await consumeOneTimeShare(share.id, testPrisma);

    expect(result).toBe(false);

    const updatedShare = await testPrisma.shareLink.findUnique({
        where: {
            id: share.id,
        },
    });

    expect(updatedShare?.viewCount).toBe(0);
});


it("rejects an expired one-time share", async () => {
    const user = await testPrisma.user.create({
        data: {
            email: "expired-test@example.com",
            passwordHash: "test-password-hash",
        },
    });

    const note = await testPrisma.note.create({
        data: {
            userId: user.id,
            title: "Expired Share Test",
            content: "This share has expired.",
        },
    });

    const share = await testPrisma.shareLink.create({
        data: {
            noteId: note.id,
            tokenHash: "expired-share-token",
            shareType: "ONE_TIME",
            accessType: "PUBLIC",
            expiresAt: new Date(Date.now() - 60_000),
        },
    });

    const result = await consumeOneTimeShare(share.id, testPrisma);

    expect(result).toBe(false);

    const updatedShare = await testPrisma.shareLink.findUnique({
        where: {
            id: share.id,
        },
    });

    expect(updatedShare?.viewCount).toBe(0);
});

it("does not consume a one-time password share when the key is wrong", async () => {
    const user = await testPrisma.user.create({
        data: {
            email: "wrong-key-test@example.com",
            passwordHash: "test-password-hash",
        },
    });

    const note = await testPrisma.note.create({
        data: {
            userId: user.id,
            title: "Password Share Test",
            content: "This should remain available after a wrong key.",
        },
    });

    const accessKey = "TEST-ACCESS-123";

    const passwordHash = await hashAccessKey(accessKey);

    const share = await testPrisma.shareLink.create({
        data: {
            noteId: note.id,
            tokenHash: "password-share-token",
            shareType: "ONE_TIME",
            accessType: "PASSWORD",
            passwordHash,
        },
    });

    const wrongKeyMatchesHash = await verifyAccessKey(
        "WRONG-ACCESS-KEY",
        passwordHash,
    );

    expect(wrongKeyMatchesHash).toBe(false);

    const before = await testPrisma.shareLink.findUnique({
        where: {
            id: share.id,
        },
    });

    expect(before?.usedAt).toBeNull();
    expect(before?.viewCount).toBe(0);

    const after = await testPrisma.shareLink.findUnique({
        where: {
            id: share.id,
        },
    });

    expect(after?.usedAt).toBeNull();
    expect(after?.viewCount).toBe(0);
});

it("consumes a one-time password share after a correct key", async () => {
    const user = await testPrisma.user.create({
        data: {
            email: "correct-key-test@example.com",
            passwordHash: "test-password-hash",
        },
    });

    const note = await testPrisma.note.create({
        data: {
            userId: user.id,
            title: "Correct Key Test",
            content: "This should be available exactly once.",
        },
    });

    const accessKey = "TEST-ACCESS-456";
    const passwordHash = await hashAccessKey(accessKey);

    const share = await testPrisma.shareLink.create({
        data: {
            noteId: note.id,
            tokenHash: "correct-password-share-token",
            shareType: "ONE_TIME",
            accessType: "PASSWORD",
            passwordHash,
        },
    });

    const keyIsValid = await verifyAccessKey(
        accessKey,
        passwordHash,
    );

    expect(keyIsValid).toBe(true);

    const firstConsumption = await consumeOneTimeShare(
        share.id,
        testPrisma,
    );

    expect(firstConsumption).toBe(true);

    const consumedShare = await testPrisma.shareLink.findUnique({
        where: {
            id: share.id,
        },
    });

    expect(consumedShare?.usedAt).not.toBeNull();
    expect(consumedShare?.viewCount).toBe(1);

    const secondConsumption = await consumeOneTimeShare(
        share.id,
        testPrisma,
    );

    expect(secondConsumption).toBe(false);

    const finalShare = await testPrisma.shareLink.findUnique({
        where: {
            id: share.id,
        },
    });

    expect(finalShare?.viewCount).toBe(1);

    const viewEvents = await testPrisma.viewEvent.count({
        where: {
            shareLinkId: share.id,
        },
    });

    expect(viewEvents).toBe(1);
});

it("allows multiple views of a valid time-based share", async () => {
    const user = await testPrisma.user.create({
        data: {
            email: "time-based-test@example.com",
            passwordHash: "test-password-hash",
        },
    });

    const note = await testPrisma.note.create({
        data: {
            userId: user.id,
            title: "Time-Based Share Test",
            content: "This can be viewed multiple times.",
        },
    });

    const share = await testPrisma.shareLink.create({
        data: {
            noteId: note.id,
            tokenHash: "time-based-share-token",
            shareType: "TIME_BASED",
            accessType: "PUBLIC",
            expiresAt: new Date(Date.now() + 60_000),
        },
    });

    const firstView = await recordTimeBasedView(
        share.id,
        testPrisma,
    );

    const secondView = await recordTimeBasedView(
        share.id,
        testPrisma,
    );

    const thirdView = await recordTimeBasedView(
        share.id,
        testPrisma,
    );

    expect(firstView).toBe(true);
    expect(secondView).toBe(true);
    expect(thirdView).toBe(true);

    const updatedShare = await testPrisma.shareLink.findUnique({
        where: {
            id: share.id,
        },
    });

    expect(updatedShare?.viewCount).toBe(3);

    const viewEvents = await testPrisma.viewEvent.count({
        where: {
            shareLinkId: share.id,
        },
    });

    expect(viewEvents).toBe(3);
});

it("rejects an expired time-based share", async () => {
    const user = await testPrisma.user.create({
        data: {
            email: "expired-time-test@example.com",
            passwordHash: "test-password-hash",
        },
    });

    const note = await testPrisma.note.create({
        data: {
            userId: user.id,
            title: "Expired Time Share",
            content: "This share has expired.",
        },
    });

    const share = await testPrisma.shareLink.create({
        data: {
            noteId: note.id,
            tokenHash: "expired-time-share-token",
            shareType: "TIME_BASED",
            accessType: "PUBLIC",
            expiresAt: new Date(Date.now() - 60_000),
        },
    });

    const result = await recordTimeBasedView(
        share.id,
        testPrisma,
    );

    expect(result).toBe(false);

    const updatedShare = await testPrisma.shareLink.findUnique({
        where: {
            id: share.id,
        },
    });

    expect(updatedShare?.viewCount).toBe(0);
});

//Revoked time-based share

it("rejects a revoked time-based share", async () => {
    const user = await testPrisma.user.create({
        data: {
            email: "revoked-time-test@example.com",
            passwordHash: "test-password-hash",
        },
    });

    const note = await testPrisma.note.create({
        data: {
            userId: user.id,
            title: "Revoked Time Share",
            content: "This share was revoked.",
        },
    });

    const share = await testPrisma.shareLink.create({
        data: {
            noteId: note.id,
            tokenHash: "revoked-time-share-token",
            shareType: "TIME_BASED",
            accessType: "PUBLIC",
            expiresAt: new Date(Date.now() + 60_000),
            revokedAt: new Date(),
        },
    });

    const result = await recordTimeBasedView(
        share.id,
        testPrisma,
    );

    expect(result).toBe(false);

    const updatedShare = await testPrisma.shareLink.findUnique({
        where: {
            id: share.id,
        },
    });

    expect(updatedShare?.viewCount).toBe(0);
});

it("allows a public one-time share through the HTTP API", async () => {
    const user = await testPrisma.user.create({
        data: {
            email: "api-public-test@example.com",
            passwordHash: "test-password-hash",
        },
    });

    const note = await testPrisma.note.create({
        data: {
            userId: user.id,
            title: "API Public Share Test",
            content: "This note was accessed through the real Hono route.",
        },
    });

    const token = "api-public-test-token";

    const share = await testPrisma.shareLink.create({
        data: {
            noteId: note.id,
            tokenHash: hashShareToken(token),
            shareType: "ONE_TIME",
            accessType: "PUBLIC",
        },
    });

    const testShare = await testPrisma.shareLink.findUnique({
        where: {
            tokenHash: hashShareToken(token),
        },
    });

    expect(testShare).not.toBeNull();

    // Create the Hono application using the test database.
    const testApp = createShareApp(testPrisma);

    const response = await testApp.request(
        `/api/share/${token}/view`,
        {
            method: "POST",
        },
    );

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.accessType).toBe("PUBLIC");
    expect(body.shareType).toBe("ONE_TIME");

    expect(body.note.title).toBe("API Public Share Test");

    expect(body.note.content).toBe(
        "This note was accessed through the real Hono route.",
    );

    const updatedShare = await testPrisma.shareLink.findUnique({
        where: {
            id: share.id,
        },
    });

    expect(updatedShare?.usedAt).not.toBeNull();
    expect(updatedShare?.viewCount).toBe(1);
});

it("unlocks a password-protected one-time share through the HTTP API", async () => {
    const user = await testPrisma.user.create({
        data: {
            email: `unlock-${Date.now()}@example.com`,
            passwordHash: "test-password-hash",
        },
    });

    const note = await testPrisma.note.create({
        data: {
            userId: user.id,
            title: "Protected Note",
            content: "This note requires an access key.",
        },
    });

    const accessKey = generateAccessKey();
    const passwordHash = await hashAccessKey(accessKey);

    const rawToken = generateShareToken();

    const share = await testPrisma.shareLink.create({
        data: {
            noteId: note.id,
            tokenHash: hashShareToken(rawToken),
            shareType: "ONE_TIME",
            accessType: "PASSWORD",
            passwordHash,
        },
    });

    const app = createShareApp(testPrisma);

    const wrongResponse = await app.request(
        `/api/share/${rawToken}/unlock`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                accessKey: "WRONG-KEY",
            }),
        },
    );

    expect(wrongResponse.status).toBe(401);

    const afterWrongKey = await testPrisma.shareLink.findUnique({
        where: {
            id: share.id,
        },
    });

    expect(afterWrongKey?.usedAt).toBeNull();
    expect(afterWrongKey?.viewCount).toBe(0);

    const correctResponse = await app.request(
        `/api/share/${rawToken}/unlock`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                accessKey,
            }),
        },
    );

    expect(correctResponse.status).toBe(200);

    const correctBody = await correctResponse.json();

    expect(correctBody.note).toEqual({
        title: "Protected Note",
        content: "This note requires an access key.",
    });

    const afterCorrectKey = await testPrisma.shareLink.findUnique({
        where: {
            id: share.id,
        },
    });

    expect(afterCorrectKey?.usedAt).not.toBeNull();
    expect(afterCorrectKey?.viewCount).toBe(1);

    const secondResponse = await app.request(
        `/api/share/${rawToken}/unlock`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                accessKey,
            }),
        },
    );

    expect(secondResponse.status).toBe(410);
});



it("unlocks a password-protected time-based share multiple times through the HTTP API", async () => {
    const user = await testPrisma.user.create({
        data: {
            email: `time-password-${Date.now()}@example.com`,
            passwordHash: "test-password-hash",
        },
    });

    const note = await testPrisma.note.create({
        data: {
            userId: user.id,
            title: "Time-Based Protected Note",
            content: "This note can be viewed multiple times until expiry.",
        },
    });

    const accessKey = generateAccessKey();
    const passwordHash = await hashAccessKey(accessKey);
    const rawToken = generateShareToken();

    const expiresAt = new Date(
        Date.now() + 60 * 60 * 1000,
    );

    const share = await testPrisma.shareLink.create({
        data: {
            noteId: note.id,
            tokenHash: hashShareToken(rawToken),
            shareType: "TIME_BASED",
            accessType: "PASSWORD",
            passwordHash,
            expiresAt,
        },
    });

    const app = createShareApp(testPrisma);

    const firstResponse = await app.request(
        `/api/share/${rawToken}/unlock`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                accessKey,
            }),
        },
    );

    expect(firstResponse.status).toBe(200);

    const firstBody = await firstResponse.json();

    expect(firstBody.note).toEqual({
        title: "Time-Based Protected Note",
        content: "This note can be viewed multiple times until expiry.",
    });

    const afterFirstView = await testPrisma.shareLink.findUnique({
        where: {
            id: share.id,
        },
    });

    expect(afterFirstView?.viewCount).toBe(1);
    expect(afterFirstView?.usedAt).toBeNull();

    const secondResponse = await app.request(
        `/api/share/${rawToken}/unlock`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                accessKey,
            }),
        },
    );

    expect(secondResponse.status).toBe(200);

    const secondBody = await secondResponse.json();

    expect(secondBody.note).toEqual({
        title: "Time-Based Protected Note",
        content: "This note can be viewed multiple times until expiry.",
    });

    const afterSecondView = await testPrisma.shareLink.findUnique({
        where: {
            id: share.id,
        },
    });

    expect(afterSecondView?.viewCount).toBe(2);
    expect(afterSecondView?.usedAt).toBeNull();

    await testPrisma.shareLink.update({
        where: {
            id: share.id,
        },
        data: {
            expiresAt: new Date(Date.now() - 1000),
        },
    });

    const expiredResponse = await app.request(
        `/api/share/${rawToken}/unlock`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                accessKey,
            }),
        },
    );

    expect(expiredResponse.status).toBe(410);

    const afterExpiry = await testPrisma.shareLink.findUnique({
        where: {
            id: share.id,
        },
    });

    expect(afterExpiry?.viewCount).toBe(2);
    expect(afterExpiry?.usedAt).toBeNull();
});

it("rate-limits repeated invalid access-key attempts", async () => {
    const user = await testPrisma.user.create({
        data: {
            email: `rate-limit-${Date.now()}@example.com`,
            passwordHash: "test-password-hash",
        },
    });

    const note = await testPrisma.note.create({
        data: {
            userId: user.id,
            title: "Rate Limited Note",
            content: "This note is protected by an access key.",
        },
    });

    const accessKey = generateAccessKey();
    const passwordHash = await hashAccessKey(accessKey);
    const rawToken = generateShareToken();

    const share = await testPrisma.shareLink.create({
        data: {
            noteId: note.id,
            tokenHash: hashShareToken(rawToken),
            shareType: "TIME_BASED",
            accessType: "PASSWORD",
            passwordHash,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
    });

    const app = createShareApp(testPrisma);

    for (let attempt = 1; attempt <= 5; attempt++) {
        const response = await app.request(
            `/api/share/${rawToken}/unlock`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Forwarded-For": "192.0.2.10",
                },
                body: JSON.stringify({
                    accessKey: "WRONG-KEY",
                }),
            },
        );

        expect(response.status).toBe(401);
    }

    const rateLimitedResponse = await app.request(
        `/api/share/${rawToken}/unlock`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Forwarded-For": "192.0.2.10",
            },
            body: JSON.stringify({
                accessKey: "WRONG-KEY",
            }),
        },
    );

    expect(rateLimitedResponse.status).toBe(429);

    expect(
        rateLimitedResponse.headers.get("Retry-After"),
    ).not.toBeNull();

    const shareAfterAttempts =
        await testPrisma.shareLink.findUnique({
            where: {
                id: share.id,
            },
        });

    expect(shareAfterAttempts?.viewCount).toBe(0);
    expect(shareAfterAttempts?.usedAt).toBeNull();
});