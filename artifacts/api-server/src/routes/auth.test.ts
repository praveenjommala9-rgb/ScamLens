import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app";

describe("protected API routes", () => {
  it("requires authentication for profiles, attempts, and admin scenarios", async () => {
    const responses = await Promise.all([
      request(app).get("/api/me"),
      request(app).get("/api/attempts"),
      request(app).get("/api/admin/scenarios"),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("exposes health without exposing account or database data", async () => {
    const response = await request(app).get("/api/healthz");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
