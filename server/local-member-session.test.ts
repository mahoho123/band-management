import { describe, expect, it } from "vitest";
import {
  issueLocalMemberSession,
  readLocalMemberSession,
} from "./_core/localMemberSession";

function makeResponse() {
  let cookieHeader = "";
  return {
    cookie(name: string, value: string) {
      cookieHeader = `${name}=${value}`;
    },
    get cookieHeader() {
      return cookieHeader;
    },
  };
}

describe("local member Band session", () => {
  it("persists the authenticated member and Band scope in a signed cookie", async () => {
    const response = makeResponse();
    const request = { protocol: "https", headers: {} } as any;

    await issueLocalMemberSession(response as any, request, {
      memberId: 42,
      bandId: 7,
      role: "member",
      name: "測試成員",
    });

    const session = await readLocalMemberSession({
      headers: { cookie: response.cookieHeader },
    } as any);

    expect(session).toMatchObject({
      memberId: 42,
      bandId: 7,
      role: "member",
      name: "測試成員",
    });
  });

  it("rejects a missing or tampered cookie", async () => {
    expect(await readLocalMemberSession({ headers: {} } as any)).toBeNull();
    expect(
      await readLocalMemberSession({
        headers: { cookie: "band_member_session=not-a-valid-token" },
      } as any),
    ).toBeNull();
  });
});
