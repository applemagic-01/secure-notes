type RateLimitEntry = {
    failures: number;
    resetAt: number;
};

// This in-memory store is enough for the POC. A multi-instance production deployment should use shared storage such as Redis.
const attempts = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let lastCleanup = Date.now();

// Periodically remove expired counters so this map does not grow forever.
function cleanupExpiredEntries() {
    const now = Date.now();

    if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
        return;
    }

    for (const [key, entry] of attempts.entries()) {
        if (entry.resetAt <= now) {
            attempts.delete(key);
        }
    }

    lastCleanup = now;
}

// Check the current failure window before allowing another authentication attempt.
export function isRateLimited(
    key: string,
    maxFailures: number,
    windowMs: number,
) {
    cleanupExpiredEntries();

    const entry = attempts.get(key);

    if (!entry) {
        return {
            limited: false,
            retryAfterSeconds: 0,
        };
    }

    if (entry.resetAt <= Date.now()) {
        attempts.delete(key);

        return {
            limited: false,
            retryAfterSeconds: 0,
        };
    }

    return {
        limited: entry.failures >= maxFailures,
        retryAfterSeconds: Math.ceil(
            (entry.resetAt - Date.now()) / 1000,
        ),
    };
}

// Only failed attempts are recorded; successful requests do not consume the failure budget.
export function recordRateLimitFailure(
    key: string,
    windowMs: number,
) {
    cleanupExpiredEntries();

    const now = Date.now();
    const existing = attempts.get(key);

    if (!existing || existing.resetAt <= now) {
        attempts.set(key, {
            failures: 1,
            resetAt: now + windowMs,
        });

        return;
    }

    existing.failures += 1;
}