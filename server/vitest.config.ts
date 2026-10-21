import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/hotel_test",
      JWT_SECRET: "test-secret",
      JWT_EXPIRES_IN: "8h",
      CLIENT_ORIGIN: "http://localhost:5173",
      COOKIE_SECURE: "false",
      PORT: "4001",
    },
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    testTimeout: 15000,
  },
});
