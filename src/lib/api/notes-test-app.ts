import { Hono } from "hono";
import type { PrismaClient } from "@/generated/prisma/client";
import { registerNoteRoutes } from "@/lib/api/notes-routes";

// Tests reuse the real note route registration with a separate test database.
export function createNoteApp(db: PrismaClient) {
    const app = new Hono().basePath("/api");

    registerNoteRoutes(app, db);

    return app;
}