import { beforeEach, describe, expect, it } from "vitest";
import { testPrisma } from "./helpers/test-db";
import { createNoteApp } from "@/lib/api/notes-test-app";
import { createSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

const app = createNoteApp(testPrisma);

describe("note authorization", () => {
    beforeEach(async () => {
        await testPrisma.session.deleteMany();
        await testPrisma.shareLink.deleteMany();
        await testPrisma.viewEvent.deleteMany();
        await testPrisma.note.deleteMany();
        await testPrisma.user.deleteMany();
    });

    async function createUser(email: string) {
        return testPrisma.user.create({
            data: {
                email,
                passwordHash: await hashPassword("Password123!"),
            },
        });
    }

    async function createAuthenticatedUser(email: string) {
        const user = await createUser(email);

        const { token } = await createSession(user.id, testPrisma);

        return { user, token };
    }

    it("rejects unauthenticated note creation", async () => {
        const response = await app.request("/api/notes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: "Private note",
                content: "Secret content",
            }),
        });

        expect(response.status).toBe(401);
    });

    it("allows an authenticated user to create a note", async () => {
        const { token } = await createAuthenticatedUser("alice@example.com");

        const response = await app.request("/api/notes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: `session=${token}`,
            },
            body: JSON.stringify({
                title: "My note",
                content: "Private content",
            }),
        });

        expect(response.status).toBe(201);

        const body = await response.json();

        expect(body.note).toBeDefined();
        expect(body.note.title).toBe("My note");
        expect(body.note.content).toBe("Private content");
    });

    it("allows a user to read their own note", async () => {
        const { user, token } =
            await createAuthenticatedUser("alice@example.com");

        const note = await testPrisma.note.create({
            data: {
                userId: user.id,
                title: "My note",
                content: "Private content",
            },
        });

        const response = await app.request(`/api/notes/${note.id}`, {
            headers: {
                Cookie: `session=${token}`,
            },
        });

        expect(response.status).toBe(200);

        const body = await response.json();

        expect(body.note.id).toBe(note.id);
        expect(body.note.title).toBe("My note");
    });

    it("prevents one user from reading another user's note", async () => {
        const owner = await createAuthenticatedUser("owner@example.com");
        const attacker =
            await createAuthenticatedUser("attacker@example.com");

        const note = await testPrisma.note.create({
            data: {
                userId: owner.user.id,
                title: "Private note",
                content: "Owner secret",
            },
        });

        const response = await app.request(`/api/notes/${note.id}`, {
            headers: {
                Cookie: `session=${attacker.token}`,
            },
        });

        expect(response.status).toBe(404);
    });

    it("prevents one user from updating another user's note", async () => {
        const owner = await createAuthenticatedUser("owner@example.com");
        const attacker =
            await createAuthenticatedUser("attacker@example.com");

        const note = await testPrisma.note.create({
            data: {
                userId: owner.user.id,
                title: "Original title",
                content: "Original content",
            },
        });

        const response = await app.request(`/api/notes/${note.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Cookie: `session=${attacker.token}`,
            },
            body: JSON.stringify({
                title: "Hacked title",
            }),
        });

        expect(response.status).toBe(404);

        const unchanged = await testPrisma.note.findUnique({
            where: { id: note.id },
        });

        expect(unchanged?.title).toBe("Original title");
    });

    it("prevents one user from deleting another user's note", async () => {
        const owner = await createAuthenticatedUser("owner@example.com");
        const attacker =
            await createAuthenticatedUser("attacker@example.com");

        const note = await testPrisma.note.create({
            data: {
                userId: owner.user.id,
                title: "Protected note",
                content: "Do not delete",
            },
        });

        const response = await app.request(`/api/notes/${note.id}`, {
            method: "DELETE",
            headers: {
                Cookie: `session=${attacker.token}`,
            },
        });

        expect(response.status).toBe(404);

        const stillExists = await testPrisma.note.findUnique({
            where: { id: note.id },
        });

        expect(stillExists).not.toBeNull();
    });

    it("allows the owner to update their note", async () => {
        const { user, token } =
            await createAuthenticatedUser("alice@example.com");

        const note = await testPrisma.note.create({
            data: {
                userId: user.id,
                title: "Old title",
                content: "Old content",
            },
        });

        const response = await app.request(`/api/notes/${note.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Cookie: `session=${token}`,
            },
            body: JSON.stringify({
                title: "Updated title",
                content: "Updated content",
            }),
        });

        expect(response.status).toBe(200);

        const updated = await testPrisma.note.findUnique({
            where: { id: note.id },
        });

        expect(updated?.title).toBe("Updated title");
        expect(updated?.content).toBe("Updated content");
    });

    it("allows the owner to delete their note", async () => {
        const { user, token } =
            await createAuthenticatedUser("alice@example.com");

        const note = await testPrisma.note.create({
            data: {
                userId: user.id,
                title: "Temporary note",
                content: "Delete me",
            },
        });

        const response = await app.request(`/api/notes/${note.id}`, {
            method: "DELETE",
            headers: {
                Cookie: `session=${token}`,
            },
        });

        expect(response.status).toBe(200);

        const deleted = await testPrisma.note.findUnique({
            where: { id: note.id },
        });

        expect(deleted).toBeNull();
    });

    it("returns 404 for a nonexistent note", async () => {
        const { token } =
            await createAuthenticatedUser("alice@example.com");

        const response = await app.request(
            "/api/notes/nonexistent-note-id",
            {
                headers: {
                    Cookie: `session=${token}`,
                },
            },
        );

        expect(response.status).toBe(404);
    });
});