import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profile: vi.fn(),
  getSupabaseServiceClient: vi.fn(),
}));

vi.mock("../lib/supabase", () => ({
  getSupabasePublicClient: () => ({
    auth: { getUser: supabaseMocks.getUser },
  }),
  createUserSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: supabaseMocks.profile,
        }),
      }),
    }),
  }),
  getSupabaseServiceClient: supabaseMocks.getSupabaseServiceClient,
}));

import app from "../app";

describe("admin API authorization", () => {
  beforeEach(() => {
    supabaseMocks.getUser.mockReset().mockResolvedValue({
      data: { user: { id: "00000000-0000-4000-8000-000000000201", email: "user@example.test" } },
      error: null,
    });
    supabaseMocks.profile.mockReset().mockResolvedValue({
      data: { role: "user" },
      error: null,
    });
    supabaseMocks.getSupabaseServiceClient.mockReset();
  });

  it("rejects a signed-in regular user before any admin data access", async () => {
    const response = await request(app)
      .get("/api/admin/scenarios")
      .set("Authorization", "Bearer test-session-token");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect(supabaseMocks.getSupabaseServiceClient).not.toHaveBeenCalled();
  });
});
