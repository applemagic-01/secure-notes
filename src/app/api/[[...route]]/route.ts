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
  getSharedNote,
  recordTimeBasedView,
} from "@/lib/share/access";

import { getClientIp } from "@/lib/security/client-ip";
import {
  isRateLimited,
  recordRateLimitFailure,
} from "@/lib/security/rate-limit";
import { registerNoteRoutes } from "@/lib/api/notes-routes";






// Share routes are grouped together because the URL token is the credential and the database decides whether it is still valid.
function registerShareRoutes(
  app: Hono,
  db: typeof prisma,
) {
  // Metadata only: this endpoint deliberately does not consume a one-time share.
  // Actual access happens through POST /view after the client knows the access type.
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

      const share = await findShareByToken(token, db);

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

  // Public share consumption happens here instead of GET, avoiding accidental
  // consumption from prefetching or duplicate development-mode requests.
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

      const share = await findShareByToken(token, db);

      if (!share) {
        return c.json(
          {
            error: "Share link not found",
          },
          404,
        );
      }

      // A password-protected share must never fall through this public endpoint.
      if (share.accessType !== "PUBLIC") {
        return c.json(
          {
            error: "This share requires an access key",
          },
          403,
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

      // One-time links are claimed atomically. Time-based links can be viewed
      // repeatedly, so they only need a validity check plus a counter increment.
      if (share.shareType === "ONE_TIME") {
        const consumed = await consumeOneTimeShare(
          share.id,
          db,
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
        const recorded = await recordTimeBasedView(
          share.id,
          db,
        );

        if (!recorded) {
          return c.json(
            {
              error: "Share link is no longer available",
            },
            410,
          );
        }
      }

      const note = await getSharedNote(
        share.noteId,
        db,
      );

      if (!note) {
        return c.json(
          {
            error: "Shared note not found",
          },
          404,
        );
      }

      return c.json({
        accessType: "PUBLIC",
        shareType: share.shareType,
        expiresAt: share.expiresAt,
        note,
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
  // Password shares verify the access key first. Only a successful verification
  // can consume a one-time link or count a successful view.
  app.post("/share/:token/unlock", async (c) => {
    try {
      const token = c.req.param("token");

      const clientIp = getClientIp(c);

      // Rate-limit by IP and by the specific share so repeated guessing is harder.
      const unlockIpRateLimit = isRateLimited(
        `unlock:ip:${clientIp}`,
        5,
        15 * 60 * 1000,
      );

      if (!token) {
        return c.json(
          {
            error: "Invalid share link",
          },
          400,
        );
      }

      if (unlockIpRateLimit.limited) {
        c.header(
          "Retry-After",
          String(unlockIpRateLimit.retryAfterSeconds),
        );

        return c.json(
          {
            error: "Too many attempts. Please try again later.",
          },
          429,
        );
      }

      const share = await findShareByToken(token, db);


      const shareRateLimit = isRateLimited(
        `unlock:share:${hashShareToken(token)}`,
        10,
        15 * 60 * 1000,
      );



      if (!share) {
        return c.json(
          {
            error: "Share link not found",
          },
          404,
        );
      }


      if (shareRateLimit.limited) {
        c.header(
          "Retry-After",
          String(shareRateLimit.retryAfterSeconds),
        );

        return c.json(
          {
            error: "Too many attempts. Please try again later.",
          },
          429,
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

      // Do the expensive Argon2 check before entering the database transaction.
      const accessKeyIsValid = await verifyAccessKey(
        accessKey,
        share.passwordHash,
      );

      if (!accessKeyIsValid) {
        recordRateLimitFailure(
          `unlock:ip:${clientIp}`,
          15 * 60 * 1000,
        );

        recordRateLimitFailure(
          `unlock:share:${hashShareToken(token)}`,
          15 * 60 * 1000,
        );

        return c.json(
          {
            error: "Invalid access key",
          },
          401,
        );
      }



      if (share.shareType === "ONE_TIME") {
        const consumed = await consumeOneTimeShare(share.id, db);

        if (!consumed) {
          return c.json(
            {
              error: "Share link is no longer available",
            },
            410,
          );
        }
      } else {
        const recorded = await recordTimeBasedView(share.id, db);

        if (!recorded) {
          return c.json(
            {
              error: "Share link is no longer available",
            },
            410,
          );
        }
      }

      const note = await getSharedNote(share.noteId,db);

      if (!note) {
        return c.json(
          {
            error: "Shared note not found",
          },
          404,
        );
      }

      return c.json({
        note,
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

}

// Production Hono application mounted under Next.js' catch-all API route.
export const app = new Hono()
  .basePath("/api");

// Production uses the real database. Tests can inject a separate Prisma client.
registerShareRoutes(app, prisma);
registerNoteRoutes(app, prisma);

// Test code can reuse these exact share handlers with the isolated test database.
export function createShareApp(db: typeof prisma) {
  const shareApp = new Hono()
    .basePath("/api");

  registerShareRoutes(shareApp, db);

  return shareApp;
}


app.get("/health", (c) => {
  return c.json({
    status: "ok",
    message: "Secure Notes API is running",
  });
});


// Registration validates input, hashes the password, and creates the account.
// The original password is never persisted.
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

// Login validates credentials and creates a server-side session.
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

    const clientIp = getClientIp(c);

    const ipRateLimit = isRateLimited(
      `login:ip:${clientIp}`,
      5,
      15 * 60 * 1000,
    );

    const emailRateLimit = isRateLimited(
      `login:email:${email}`,
      5,
      15 * 60 * 1000,
    );

    if (ipRateLimit.limited || emailRateLimit.limited) {
      const retryAfter = Math.max(
        ipRateLimit.retryAfterSeconds,
        emailRateLimit.retryAfterSeconds,
      );

      c.header("Retry-After", String(retryAfter));

      return c.json(
        {
          error: "Too many login attempts. Please try again later.",
        },
        429,
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      recordRateLimitFailure(
        `login:ip:${clientIp}`,
        15 * 60 * 1000,
      );

      recordRateLimitFailure(
        `login:email:${email}`,
        15 * 60 * 1000,
      );

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
      recordRateLimitFailure(
        `login:ip:${clientIp}`,
        15 * 60 * 1000,
      );

      recordRateLimitFailure(
        `login:email:${email}`,
        15 * 60 * 1000,
      );

      return c.json(
        {
          error: "Invalid email or password",
        },
        401,
      );
    }

    const { token } = await createSession(user.id);

    // HttpOnly prevents JavaScript from reading the session token. SameSite=Lax
    // provides a useful CSRF baseline and Secure is enabled in production.
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
      },
      500,
    );
  }
});

// The UI uses this endpoint to resolve the current user from the session cookie.
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

// Logout invalidates the server-side session and clears the browser cookie.
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

// Only the note owner can create a share. Secrets are generated on the server.
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

    // Keep the raw token only long enough to build the owner-facing URL.
    // The database receives only the SHA-256 token hash.
    const rawToken = generateShareToken();
    const tokenHash = hashShareToken(rawToken);

    let passwordHash: string | null = null;
    let accessKey: string | null = null;

    // Password shares get a random access key. The owner sees it once;
    // PostgreSQL stores only its Argon2id hash.
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

    const appUrl = process.env.APP_URL;

    if (!appUrl) {
      console.error("APP_URL is not configured");

      return c.json(
        {
          error: "Unable to create share link",
        },
        500,
      );
    }

    const shareUrl = `${appUrl.replace(/\/$/, "")}/share/${rawToken}`;

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


// Share management is owner-only and never returns raw secrets.
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



// Revocation is an owner-only state change. Keeping the row preserves its history.
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





// Next.js forwards each HTTP method into the same Hono application.
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
