// Confirms the test environment can reach the configured PostgreSQL database before security behavior is evaluated.

import { describe, expect, it, afterAll } from "vitest";
import {
    testPrisma,
    disconnectTestDatabase,
} from "./helpers/test-db";

describe("test database connection", () => {
    it("connects to the test database", async () => {
        const result = await testPrisma.$queryRaw<
            Array<{ result: number }>
        >`SELECT 1 AS result`;

        expect(result[0].result).toBe(1);
    });

    afterAll(async () => {
        await disconnectTestDatabase();
    });
});