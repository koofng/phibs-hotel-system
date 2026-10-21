import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../setup.js";
import { app, createUser, loginAgent } from "../helpers.js";
import request from "supertest";

describe("auth", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("logs in with valid credentials and sets a session cookie", async () => {
    const user = await createUser({ email: "admin@test.local", role: "ADMIN" });
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "password123" })
      .expect(200);

    expect(res.body.user.email).toBe(user.email);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects invalid credentials", async () => {
    const user = await createUser({ email: "admin2@test.local" });
    await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "wrong-password" })
      .expect(401);
  });

  it("rejects protected routes without a session", async () => {
    await request(app).get("/api/v1/auth/me").expect(401);
  });

  it("rejects a FRONT_DESK user from an admin-only route", async () => {
    const staff = await createUser({ email: "staff@test.local", role: "FRONT_DESK" });
    const agent = await loginAgent(staff.email);
    await agent.get("/api/v1/users").expect(403);
  });

  it("allows an ADMIN user to access admin-only routes", async () => {
    const admin = await createUser({ email: "admin3@test.local", role: "ADMIN" });
    const agent = await loginAgent(admin.email);
    await agent.get("/api/v1/users").expect(200);
  });
});
