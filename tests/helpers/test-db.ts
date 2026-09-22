import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";


const databaseUrl = process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
    throw new Error(
        "TEST_DATABASE_URL must be configured before running database tests.",
    );
}

const pool = new Pool({
    connectionString: databaseUrl,
});

const adapter = new PrismaPg(pool);

export const testPrisma = new PrismaClient({
    adapter,
});

export async function disconnectTestDatabase() {
    await testPrisma.$disconnect();
    await pool.end();
}