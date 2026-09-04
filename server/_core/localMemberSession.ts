import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";

export const LOCAL_MEMBER_COOKIE_NAME = "band_member_session";
export const LOCAL_ADMIN_COOKIE_NAME = "band_admin_session";
const LOCAL_MEMBER_SESSION_MS = 1000 * 60 * 60 * 24 * 30;

type LocalMemberSession = {
  memberId: number;
  bandId: number;
  userId?: number;
  role: "member";
  name: string;
};

function secretKey() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

async function issueSession(res: Response, req: Request, cookieName: string, session: LocalMemberSession, maxAge = LOCAL_MEMBER_SESSION_MS) {
  const token = await new SignJWT({
    memberId: session.memberId,
    bandId: session.bandId,
    ...(session.userId ? { userId: session.userId } : {}),
    role: session.role,
    name: session.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());

  res.cookie(cookieName, token, {
    ...getSessionCookieOptions(req),
    maxAge,
  });
}

export async function issueLocalMemberSession(res: Response, req: Request, session: LocalMemberSession) {
  await issueSession(res, req, LOCAL_MEMBER_COOKIE_NAME, session);
}

export async function issueLocalAdminSession(res: Response, req: Request, name = "主管", userId?: number) {
  await issueSession(res, req, LOCAL_ADMIN_COOKIE_NAME, {
    memberId: 0,
    bandId: 1,
    role: "member",
    name,
    ...(userId ? { userId } : {}),
  }, LOCAL_MEMBER_SESSION_MS);
}

async function readSession(req: Request, cookieName: string): Promise<LocalMemberSession | null> {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) return null;

  const token = parseCookieHeader(rawCookie)[cookieName];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (
      typeof payload.memberId !== "number" ||
      typeof payload.bandId !== "number" ||
      payload.role !== "member" ||
      (payload.userId !== undefined && typeof payload.userId !== "number") ||
      typeof payload.name !== "string"
    ) {
      return null;
    }

    return {
      memberId: payload.memberId,
      bandId: payload.bandId,
      ...(typeof payload.userId === "number" ? { userId: payload.userId } : {}),
      role: "member",
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export async function readLocalMemberSession(req: Request) {
  return readSession(req, LOCAL_MEMBER_COOKIE_NAME);
}

export async function readLocalAdminSession(req: Request) {
  return readSession(req, LOCAL_ADMIN_COOKIE_NAME);
}

export function clearLocalMemberSession(res: Response, req: Request) {
  const options = getSessionCookieOptions(req);
  res.clearCookie(LOCAL_MEMBER_COOKIE_NAME, options);
  res.clearCookie(LOCAL_ADMIN_COOKIE_NAME, options);
}

export type { LocalMemberSession };
