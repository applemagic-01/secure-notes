import { Hono } from "hono";
import { getCookie } from "hono/cookie";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
    createNoteSchema,
    updateNoteSchema,
} from "@/lib/validation/note";

// Keeping route registration separate lets production and tests share the same authorization and database behavior.
export function registerNoteRoutes(
    app: Hono,
    db: typeof prisma,
) {
    app.post("/notes", async (c) => {
        try {
            const token = getCookie(c, "session");

            // The authenticated user comes from the server-side session, never from request data.
            const user = await getAuthenticatedUser(token, db);

            if (!user) {
                return c.json(
                    {
                        error: "Unauthorized",
                    },
                    401,
                );
            }

            const body = await c.req.json();

            // Validate again on the server even if the frontend already validates the form.
            const result = createNoteSchema.safeParse(body);

            if (!result.success) {
                return c.json(
                    {
                        error: "Invalid request",
                        details: result.error.flatten().fieldErrors,
                    },
                    400,
                );
            }

            const { title, content } = result.data;

            const note = await db.note.create({
                data: {
                    userId: user.id,
                    title,
                    content,
                },
                select: {
                    id: true,
                    title: true,
                    content: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            return c.json(
                {
                    note,
                },
                201,
            );
        } catch (error) {
            console.error("Create note error:", error);

            return c.json(
                {
                    error: "Unable to create note",
                },
                500,
            );
        }
    });

    app.get("/notes", async (c) => {
        try {
            const sessionToken = getCookie(c, "session");

            const user = await getAuthenticatedUser(
                sessionToken,
                db,
            );

            if (!user) {
                return c.json(
                    {
                        error: "Unauthorized",
                    },
                    401,
                );
            }

            // userId is part of authorization here, not just a filter. It prevents users from seeing someone else's notes.
            const notes = await db.note.findMany({
                where: {
                    userId: user.id,
                },
                orderBy: {
                    updatedAt: "desc",
                },
                select: {
                    id: true,
                    title: true,
                    content: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            return c.json({
                notes,
            });
        } catch (error) {
            console.error("List notes error:", error);

            return c.json(
                {
                    error: "Unable to fetch notes",
                },
                500,
            );
        }
    });

    app.get("/notes/:id", async (c) => {
        try {
            const token = getCookie(c, "session");

            const user = await getAuthenticatedUser(token, db);

            if (!user) {
                return c.json(
                    {
                        error: "Unauthorized",
                    },
                    401,
                );
            }

            const noteId = c.req.param("id");

            // Check the note ID and owner ID together to prevent an IDOR-style access bug.
            const note = await db.note.findFirst({
                where: {
                    id: noteId,
                    userId: user.id,
                },
                select: {
                    id: true,
                    title: true,
                    content: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (!note) {
                return c.json(
                    {
                        error: "Note not found",
                    },
                    404,
                );
            }

            return c.json({
                note,
            });
        } catch (error) {
            console.error("Get note error:", error);

            return c.json(
                {
                    error: "Unable to get note",
                },
                500,
            );
        }
    });

    app.patch("/notes/:id", async (c) => {
        try {
            const token = getCookie(c, "session");

            const user = await getAuthenticatedUser(token, db);

            if (!user) {
                return c.json(
                    {
                        error: "Unauthorized",
                    },
                    401,
                );
            }

            const noteId = c.req.param("id");

            const body = await c.req.json();

            const result = updateNoteSchema.safeParse(body);

            if (!result.success) {
                return c.json(
                    {
                        error: "Invalid request",
                        details: result.error.flatten().fieldErrors,
                    },
                    400,
                );
            }

            // Include ownership in the database UPDATE itself so another user's note cannot be modified.
            const updated = await db.note.updateMany({
                where: {
                    id: noteId,
                    userId: user.id,
                },
                data: result.data,
            });

            if (updated.count === 0) {
                return c.json(
                    {
                        error: "Note not found",
                    },
                    404,
                );
            }

            const updatedNote = await db.note.findFirst({
                where: {
                    id: noteId,
                    userId: user.id,
                },
                select: {
                    id: true,
                    title: true,
                    content: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            return c.json({
                note: updatedNote,
            });
        } catch (error) {
            console.error("Update note error:", error);

            return c.json(
                {
                    error: "Unable to update note",
                },
                500,
            );
        }
    });

    app.delete("/notes/:id", async (c) => {
        try {
            const token = getCookie(c, "session");

            const user = await getAuthenticatedUser(token, db);

            if (!user) {
                return c.json(
                    {
                        error: "Unauthorized",
                    },
                    401,
                );
            }

            const noteId = c.req.param("id");

            // The owner check also protects deletion. Prisma cascades dependent share records.
            const deleted = await db.note.deleteMany({
                where: {
                    id: noteId,
                    userId: user.id,
                },
            });

            if (deleted.count === 0) {
                return c.json(
                    {
                        error: "Note not found",
                    },
                    404,
                );
            }

            return c.json({
                message: "Note deleted successfully",
            });
        } catch (error) {
            console.error("Delete note error:", error);

            return c.json(
                {
                    error: "Unable to delete note",
                },
                500,
            );
        }
    });
}