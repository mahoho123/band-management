export const DEFAULT_BAND_WORKSPACE = {
  id: 1,
  name: "慢半拍",
  slug: "man-ban-pai",
} as const;

export type BandWorkspaceRole = "owner" | "admin" | "member";
export type BandMembershipStatus = "active" | "invited" | "suspended";

export interface BandWorkspace {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string;
}

export interface BandWorkspaceMembership {
  bandId: number;
  userId: number;
  role: BandWorkspaceRole;
  status: BandMembershipStatus;
}

export type BandScopedEntity =
  | "members"
  | "events"
  | "attendance"
  | "holidays"
  | "notifications"
  | "pushSubscriptions";

export function makeBandScopeKey(bandId: number, entity: BandScopedEntity): string {
  if (!Number.isInteger(bandId) || bandId < 1) {
    throw new Error("Invalid Band workspace id");
  }
  return `band:${bandId}:${entity}`;
}

export function canAccessBand(
  membership: Pick<BandWorkspaceMembership, "bandId" | "status"> | null | undefined,
  bandId: number,
): boolean {
  return Boolean(
    membership &&
      membership.bandId === bandId &&
      membership.status === "active",
  );
}

export function canManageBand(
  membership: Pick<BandWorkspaceMembership, "bandId" | "role" | "status"> | null | undefined,
  bandId: number,
): boolean {
  return Boolean(
    canAccessBand(membership, bandId) &&
      (membership?.role === "owner" || membership?.role === "admin"),
  );
}
