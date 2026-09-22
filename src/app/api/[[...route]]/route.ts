import { Hono } from "hono";
import { handle } from "hono/vercel";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, getSessionUser, deleteSession, getAuthenticatedUser } from "@/lib/auth/session";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { createNoteSchema, updateNoteSchema } from "@/lib/validation/note";
import { createShareSchema } from "@/lib/validation/share";
import { generateShareToken, hashShareToken } from "@/lib/share/token";
import {
  generateAccessKey,
  hashAccessKey,
  verifyAccessKey,
} from "@/lib/share/access-key";
import {
  consumeOneTimeShare,
  findShareByToken,
  recordTimeBasedView,
} from "@/lib/share/access";



const app = new Hono().basePath("/api");

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    message: "Secure Notes API is running",
  });
});

app.get("/db-health", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return c.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    return c.json(
      {
        status: "error",
        database: "disconnected",
      },
      500,
    );
  }
});

app.post("/auth/register", async (c) => {
  try {
    const body = await c.req.json();

    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        {
          error: "Invalid request",
          details: result.error.flatten().fieldErrors,
        },
        400,
      );
    }

    const { email, password } = result.data;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return c.json(
        {
          error: "Unable to create account",
        },
        409,
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return c.json(
      {
        user,
      },
      201,
    );
  } catch (error) {
    console.error("Registration error:", error);

    return c.json(
      {
        error: "Unable to create account",
      },
      500,
    );
  }
});

app.post("/auth/login", async (c) => {
  try {
    const body = await c.req.json();

    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        {
          error: "Invalid request",
          details: result.error.flatten().fieldErrors,
        },
        400,
      );
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return c.json(
        {
          error: "Invalid email or password",
        },
        401,
      );
    }

    const passwordIsValid = await verifyPassword(
      user.passwordHash,
      password,
    );

    if (!passwordIsValid) {
      return c.json(
        {
          error: "Invalid email or password",
        },
        401,
      );
    }

    const { token } = await createSession(user.id);

    setCookie(c, "session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return c.json(
      {
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
      200,
    );
  } catch (error) {
    console.error("Login error:", error);

    return c.json(
      {
        error: "Unable to login",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

app.get("/auth/me", async (c) => {
  try {
    const token = getCookie(c, "session");

    if (!token) {
      return c.json(
        {
          error: "Unauthorized",
        },
        401,
      );
    }

    const user = await getSessionUser(token);

    if (!user) {
      return c.json(
        {
          error: "Unauthorized",
        },
        401,
      );
    }

    return c.json({
      user,
    });
  } catch (error) {
    console.error("Auth check error:", error);

    return c.json(
      {
        error: "Unable to authenticate",
      },
      500,
    );
  }
});

app.post("/auth/logout", async (c) => {
  try {
    const token = getCookie(c, "session");

    if (token) {
      await deleteSession(token);
    }

    deleteCookie(c, "session", {
      path: "/",
    });

    return c.json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return c.json(
      {
        error: "Unable to logout",
      },
      500,
    );
  }
});

app.post("/notes", async (c) => {
  try {
    const token = getCookie(c, "session");

    const user = await getAuthenticatedUser(token);

    if (!user) {
      return c.json(
        {
          error: "Unauthorized",
        },
        401,
      );
    }

    const body = await c.req.json();

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

    const note = await prisma.note.create({
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

    const user = await getAuthenticatedUser(sessionToken);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const notes = await prisma.note.findMany({
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
      500
    );
  }
});

app.get("/notes/:id", async (c) => {
  try {
    const token = getCookie(c, "session");

    const user = await getAuthenticatedUser(token);

    if (!user) {
      return c.json(
        {
          error: "Unauthorized",
        },
        401,
      );
    }

    const noteId = c.req.param("id");

    const note = await prisma.note.findFirst({
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

    const user = await getAuthenticatedUser(token);

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

    const note = await prisma.note.updateMany({
      where: {
        id: noteId,
        userId: user.id,
      },
      data: result.data,
    });

    if (note.count === 0) {
      return c.json(
        {
          error: "Note not found",
        },
        404,
      );
    }

    const updatedNote = await prisma.note.findFirst({
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

    const user = await getAuthenticatedUser(token);

    if (!user) {
      return c.json(
        {
          error: "Unauthorized",
        },
        401,
      );
    }

    const noteId = c.req.param("id");

    const result = await prisma.note.deleteMany({
      where: {
        id: noteId,
        userId: user.id,
      },
    });

    if (result.count === 0) {
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


app.post("/notes/:id/shares", async (c) => {
  try {
    const token = getCookie(c, "session");

    const user = await getAuthenticatedUser(token);

    if (!user) {
      return c.json(
        {
          error: "Unauthorized",
        },
        401,
      );
    }

    const noteId = c.req.param("id");

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: user.id,
      },
      select: {
        id: true,
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

    const body = await c.req.json();

    const result = createShareSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        {
          error: "Invalid request",
          details: result.error.flatten().fieldErrors,
        },
        400,
      );
    }

    const {
      shareType,
      accessType,
      expiresAt
    } = result.data;

    const rawToken = generateShareToken();
    const tokenHash = hashShareToken(rawToken);

    let passwordHash: string | null = null;
    let accessKey: string | null = null;

    if (accessType === "PASSWORD") {
      accessKey = generateAccessKey();
      passwordHash = await hashAccessKey(accessKey);
      
    }

    let parsedExpiresAt: Date | null = null;

    if (shareType === "TIME_BASED" && expiresAt) {
      parsedExpiresAt = new Date(expiresAt);

      if (parsedExpiresAt <= new Date()) {
        return c.json(
          {
            error: "Expiry date must be in the future",
          },
          400,
        );
      }
    }

    const shareLink = await prisma.shareLink.create({
      data: {
        noteId: note.id,
        tokenHash,
        shareType,
        accessType,
        passwordHash,
        expiresAt: parsedExpiresAt,
      },
      select: {
        id: true,
        shareType: true,
        accessType: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    const origin = new URL(c.req.url).origin;

    const shareUrl = `${origin}/share/${rawToken}`;

    return c.json(
      {
        share: {
          ...shareLink,
          shareUrl,
          ...(accessType === "PASSWORD"
            ? {
              accessKey,
            }
            : {}),
        },
      },
      201,
    );
  } catch (error) {
    console.error("Create share error:", error);

    return c.json(
      {
        error: "Unable to create share link",
      },
      500,
    );
  }
});


app.get("/notes/:id/shares", async (c) => {
  try {
    const sessionToken = getCookie(c, "session");

    const user = await getAuthenticatedUser(sessionToken);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const noteId = c.req.param("id");

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!note) {
      return c.json({ error: "Note not found" }, 404);
    }

    const shares = await prisma.shareLink.findMany({
      where: {
        noteId: note.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        shareType: true,
        accessType: true,
        expiresAt: true,
        revokedAt: true,
        usedAt: true,
        viewCount: true,
        createdAt: true,
      },
    });

    return c.json({
      shares,
    });
  } catch (error) {
    console.error("List shares error:", error);

    return c.json(
      {
        error: "Unable to fetch share links",
      },
      500
    );
  }
});

app.get("/share/:token", async (c) => {
  try {
    const token = c.req.param("token");

    if (!token) {
      return c.json(
        {
          error: "Invalid share link",
        },
        400,
      );
    }

    const share = await findShareByToken(token);

    if (!share) {
      return c.json(
        {
          error: "Share link not found",
        },
        404,
      );
    }

    if (share.revokedAt) {
      return c.json(
        {
          error: "Share link has been revoked",
        },
        410,
      );
    }

    if (
      share.expiresAt &&
      share.expiresAt <= new Date()
    ) {
      return c.json(
        {
          error: "Share link has expired",
        },
        410,
      );
    }

    if (
      share.shareType === "ONE_TIME" &&
      share.usedAt
    ) {
      return c.json(
        {
          error: "Share link has already been used",
        },
        410,
      );
    }

    return c.json({
      accessType: share.accessType,
      shareType: share.shareType,
      expiresAt: share.expiresAt,
    });
  } catch (error) {
    console.error("Share lookup error:", error);

    return c.json(
      {
        error: "Unable to access share link",
      },
      500,
    );
  }
});


app.post("/share/:token/view", async (c) => {
  try {
    const token = c.req.param("token");

    if (!token) {
      return c.json(
        {
          error: "Invalid share link",
        },
        400,
      );
    }

    const share = await findShareByToken(token);

    if (!share) {
      return c.json(
        {
          error: "Share link not found",
        },
        404,
      );
    }

    if (share.revokedAt) {
      return c.json(
        {
          error: "Share link has been revoked",
        },
        410,
      );
    }

    if (
      share.expiresAt &&
      share.expiresAt <= new Date()
    ) {
      return c.json(
        {
          error: "Share link has expired",
        },
        410,
      );
    }

    if (share.shareType === "ONE_TIME") {
      const consumed = await consumeOneTimeShare(
        share.id,
      );

      if (!consumed) {
        return c.json(
          {
            error: "Share link has already been used",
          },
          410,
        );
      }
    } else {
      const recorded = await recordTimeBasedView(share.id);

      if (!recorded) {
        return c.json(
          {
            error: "Share link is no longer available",
          },
          410,
        );
      }
    }

    return c.json({
      accessType: "PUBLIC",
      shareType: share.shareType,
      expiresAt: share.expiresAt,
      note: {
        title: share.note.title,
        content: share.note.content,
      },
    });
  } catch (error) {
    console.error("Share view error:", error);

    return c.json(
      {
        error: "Unable to access shared note",
      },
      500,
    );
  }
});


app.post("/share/:token/unlock", async (c) => {
  try {
    const token = c.req.param("token");

    if (!token) {
      return c.json(
        {
          error: "Invalid share link",
        },
        400,
      );
    }

    const share = await findShareByToken(token);

    if (!share) {
      return c.json(
        {
          error: "Share link not found",
        },
        404,
      );
    }

    if (share.revokedAt) {
      return c.json(
        {
          error: "Share link has been revoked",
        },
        410,
      );
    }

    if (share.expiresAt && share.expiresAt <= new Date()) {
      return c.json(
        {
          error: "Share link has expired",
        },
        410,
      );
    }

    if (share.shareType === "ONE_TIME" && share.usedAt) {
      return c.json(
        {
          error: "Share link has already been used",
        },
        410,
      );
    }

    if (share.accessType !== "PASSWORD" || !share.passwordHash) {
      return c.json(
        {
          error: "This share does not require an access key",
        },
        400,
      );
    }

    const body = await c.req.json();

    const accessKey =
      typeof body.accessKey === "string"
        ? body.accessKey
        : "";

    if (!accessKey) {
      return c.json(
        {
          error: "Access key is required",
        },
        400,
      );
    }

    const accessKeyIsValid = await verifyAccessKey(
      accessKey,
      share.passwordHash,
    );

    if (!accessKeyIsValid) {
      return c.json(
        {
          error: "Invalid access key",
        },
        401,
      );
    }

    if (share.shareType === "ONE_TIME") {
      const consumed = await consumeOneTimeShare(share.id);

      if (!consumed) {
        return c.json(
          {
            error: "Share link is no longer available",
          },
          410,
        );
      }
    } else {
      const recorded = await recordTimeBasedView(share.id);

      if (!recorded) {
        return c.json(
          {
            error: "Share link is no longer available",
          },
          410,
        );
      }
    }

    return c.json({
      note: {
        title: share.note.title,
        content: share.note.content,
      },
    });
  } catch (error) {
    console.error("Share unlock error:", error);

    return c.json(
      {
        error: "Unable to unlock share",
      },
      500,
    );
  }
});


app.post("/notes/:noteId/shares/:shareId/revoke", async (c) => {
  const token = getCookie(c, "session");

  const user = await getAuthenticatedUser(token);

  if (!user) {
    return c.json(
      { error: "Unauthorized" },
      401,
    );
  }

  const noteId = c.req.param("noteId");
  const shareId = c.req.param("shareId");

  const share = await prisma.shareLink.findFirst({
    where: {
      id: shareId,
      noteId,
      note: {
        userId: user.id,
      },
    },
  });

  if (!share) {
    return c.json(
      { error: "Share link not found" },
      404,
    );
  }

  if (share.revokedAt) {
    return c.json(
      { error: "Share link is already revoked" },
      409,
    );
  }

  const revokedShare = await prisma.shareLink.update({
    where: {
      id: share.id,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return c.json({
    success: true,
    share: {
      id: revokedShare.id,
      revokedAt: revokedShare.revokedAt,
    },
  });
});





export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
