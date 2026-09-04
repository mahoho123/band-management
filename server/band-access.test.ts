import { beforeEach, describe, expect, it, vi } from "vitest";

const { getBandMembership } = vi.hoisted(() => ({ getBandMembership: vi.fn() }));
vi.mock("./workspaceDb", () => ({ getBandMembership }));

import { resolveBandId } from "./routers/band";

describe("Band access boundaries", () => {
  beforeEach(() => {
    getBandMembership.mockReset();
  });

  it("keeps a local member inside the authenticated member Band", async () => {
    const ctx = {
      user: null,
      localMember: { bandId: 7 },
      localAdmin: null,
    };

    await expect(resolveBandId(ctx, 8)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(resolveBandId(ctx, 7)).resolves.toBe(7);
  });

  it("allows a local admin to access only an active membership", async () => {
    getBandMembership.mockResolvedValueOnce({ bandId: 9, userId: 3, status: "active" });
    await expect(
      resolveBandId({
        user: null,
        localMember: null,
        localAdmin: { bandId: 1, userId: 3 },
      }, 9),
    ).resolves.toBe(9);

    getBandMembership.mockResolvedValueOnce(null);
    await expect(
      resolveBandId({
        user: null,
        localMember: null,
        localAdmin: { bandId: 1, userId: 3 },
      }, 10),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
