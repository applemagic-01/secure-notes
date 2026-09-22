import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
    test: {
        environment: "node",
        globals: true,

        // Database integration tests share one test database.
        // Run test files sequentially so cleanup in one file
        // cannot interfere with another file.
        fileParallelism: false,
    },

    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});