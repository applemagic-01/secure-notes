// Verifies the rate limiter allows normal traffic and blocks requests once the configured threshold is reached.

import {
    describe,
    expect,
    it,
} from "vitest";

import {
    isRateLimited,
    recordRateLimitFailure,
} from "@/lib/security/rate-limit";

describe("rate limiter", () => {
    it("allows a new key", () => {
        const key = `new-${Date.now()}`;

        const result = isRateLimited(
            key,
            5,
            15 * 60 * 1000,
        );

        expect(result.limited).toBe(false);
        expect(result.retryAfterSeconds).toBe(0);
    });

    it("blocks a key after the configured failure count", () => {
        const key = `blocked-${Date.now()}`;
        const windowMs = 15 * 60 * 1000;

        for (let i = 0; i < 5; i++) {
            recordRateLimitFailure(
                key,
                windowMs,
            );
        }

        const result = isRateLimited(
            key,
            5,
            windowMs,
        );

        expect(result.limited).toBe(true);
        expect(result.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("tracks different keys independently", () => {
        const keyA = `independent-a-${Date.now()}`;
        const keyB = `independent-b-${Date.now()}`;

        const windowMs = 15 * 60 * 1000;

        for (let i = 0; i < 5; i++) {
            recordRateLimitFailure(
                keyA,
                windowMs,
            );
        }

        const resultA = isRateLimited(
            keyA,
            5,
            windowMs,
        );

        const resultB = isRateLimited(
            keyB,
            5,
            windowMs,
        );

        expect(resultA.limited).toBe(true);
        expect(resultB.limited).toBe(false);
    });

    it("resets a key after its window expires", () => {
        const key = `reset-${Date.now()}`;

        recordRateLimitFailure(
            key,
            0,
        );

        const result = isRateLimited(
            key,
            1,
            0,
        );

        expect(result.limited).toBe(false);
    });
});