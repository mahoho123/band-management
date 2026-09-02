import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  addBandMembership,
  createBandWorkspace,
  getBandMembership,
  listAccessibleBands,
} from "../workspaceDb";

function currentUserId(user: { id: number | string }) {
  const id = Number(user.id);
  if (!Number.isInteger(id) || id < 1) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "登入身份無效" });
  }
  return id;
}

export const workspaceRouter = router({
  list: protectedProcedure.query(({ ctx }) => listAccessibleBands(currentUserId(ctx.user))),

  create: protectedProcedure
    .input(z.object({
      name: z.string().trim().min(1).max(255),
      slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(120),
      logoUrl: z.string().url().optional().nullable(),
      primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#D4A017"),
    }))
    .mutation(({ ctx, input }) => createBandWorkspace(input, currentUserId(ctx.user))),

  join: protectedProcedure
    .input(z.object({ bandId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const userId = currentUserId(ctx.user);
      const existing = await getBandMembership(userId, input.bandId);
      if (existing) return existing;
      await addBandMembership(input.bandId, userId, "member");
      return getBandMembership(userId, input.bandId);
    }),
});
