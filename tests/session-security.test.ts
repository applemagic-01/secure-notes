import {
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import {
    createSession,
    deleteSession,
    generateSessionToken,
    getSessionExpiry,
    getSessionUser,
    hashSessionToken,
} from "@/lib/auth/session";

import { testPrisma } from "./helpers/test-db";

describe("session security", () => {
    beforeEach(async () => {
        await testPrisma.session.deleteMany();
        await testPrisma.viewEvent.deleteMany();
        await testPrisma.shareLink.deleteMany();
        await testPrisma.note.deleteMany();
        await testPrisma.user.deleteMany();
    });

    it("generates cryptographically random session tokens", () => {
        const tokenA = generateSessionToken();
        const tokenB = generateSessionToken();

        expect(tokenA).not.toBe(tokenB);
        expect(tokenA.length).toBeGreaterThan(30);
        expect(tokenB.length).toBeGreaterThan(30);
    });

    it("stores only the session token hash", async () => {
        const user = await testPrisma.user.create({
            data: {
                email: `session-hash-${Date.now()}@example.com`,
                passwordHash: "test-password-hash",
            },
        });

        const { token } = await createSession(
            user.id,
            testPrisma,
        );

        const session = await testPrisma.session.findFirst({
            where: {
                userId: user.id,
            },
        });

        expect(session).not.toBeNull();
        expect(session?.tokenHash).toBe(
            hashSessionToken(token),
        );

        expect(session?.tokenHash).not.toBe(token);
    });

    it("retrieves a valid session user", async () => {
        const user = await testPrisma.user.create({
            data: {
                email: `valid-session-${Date.now()}@example.com`,
                passwordHash: "test-password-hash",
            },
        });

        const { token } = await createSession(
            user.id,
            testPrisma,
        );

        const authenticatedUser =
            await getSessionUser(
                token,
                testPrisma,
            );

        expect(authenticatedUser).toEqual({
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
        });
    });

    it("rejects an invalid session token", async () => {
        const user = await testPrisma.user.create({
            data: {
                email: `invalid-session-${Date.now()}@example.com`,
                passwordHash: "test-password-hash",
            },
        });

        await createSession(
            user.id,
            testPrisma,
        );

        const authenticatedUser =
            await getSessionUser(
                "invalid-session-token",
                testPrisma,
            );

        expect(authenticatedUser).toBeNull();
    });

    it("rejects and removes an expired session", async () => {
        const user = await testPrisma.user.create({
            data: {
                email: `expired-session-${Date.now()}@example.com`,
                passwordHash: "test-password-hash",
            },
        });

        const token = generateSessionToken();

        await testPrisma.session.create({
            data: {
                userId: user.id,
                tokenHash: hashSessionToken(token),
                expiresAt: new Date(
                    Date.now() - 60 * 1000,
                ),
            },
        });

        const authenticatedUser =
            await getSessionUser(
                token,
                testPrisma,
            );

        expect(authenticatedUser).toBeNull();

        const remainingSession =
            await testPrisma.session.findFirst({
                where: {
                    userId: user.id,
                },
            });

        expect(remainingSession).toBeNull();
    });

    it("deletes a session during logout", async () => {
        const user = await testPrisma.user.create({
            data: {
                email: `logout-session-${Date.now()}@example.com`,
                passwordHash: "test-password-hash",
            },
        });

        const { token } = await createSession(
            user.id,
            testPrisma,
        );

        await deleteSession(
            token,
            testPrisma,
        );

        const authenticatedUser =
            await getSessionUser(
                token,
                testPrisma,
            );

        expect(authenticatedUser).toBeNull();
    });

    it("does not authenticate another user's session", async () => {
        const userA = await testPrisma.user.create({
            data: {
                email: `session-a-${Date.now()}@example.com`,
                passwordHash: "test-password-hash",
            },
        });

        const userB = await testPrisma.user.create({
            data: {
                email: `session-b-${Date.now()}@example.com`,
                passwordHash: "test-password-hash",
            },
        });

        const { token: userAToken } =
            await createSession(
                userA.id,
                testPrisma,
            );

        const authenticatedUser =
            await getSessionUser(
                userAToken,
                testPrisma,
            );

        expect(authenticatedUser?.id).toBe(
            userA.id,
        );

        expect(authenticatedUser?.id).not.toBe(
            userB.id,
        );
    });

    it("creates sessions with a future expiry", async () => {
        const user = await testPrisma.user.create({
            data: {
                email: `expiry-session-${Date.now()}@example.com`,
                passwordHash: "test-password-hash",
            },
        });

        const { session } = await createSession(
            user.id,
            testPrisma,
        );

        expect(session.expiresAt.getTime()).toBeGreaterThan(
            Date.now(),
        );

        expect(session.expiresAt.getTime()).toBeLessThanOrEqual(
            getSessionExpiry().getTime(),
        );
    });
});