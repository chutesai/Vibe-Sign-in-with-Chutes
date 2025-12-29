/**
 * Server-Side Authentication Helpers
 * Copy from: packages/nextjs/lib/serverAuth.ts
 */

import { cookies } from "next/headers";

export const COOKIE_ACCESS_TOKEN = "chutes_access_token";
export const COOKIE_REFRESH_TOKEN = "chutes_refresh_token";
export const COOKIE_USERINFO = "chutes_userinfo";

const isProd = process.env.NODE_ENV === "production";

export const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
};

export async function getServerAccessToken(): Promise<string | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_ACCESS_TOKEN)?.value;
    return token || null;
  } catch {
    return null;
  }
}

export async function getServerUserInfo(): Promise<Record<string, unknown> | null> {
  try {
    const store = await cookies();
    const raw = store.get(COOKIE_USERINFO)?.value;
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

export type ChutesUser = {
  sub?: string;
  username?: string;
  email?: string;
  name?: string;
  created_at?: string;
  [key: string]: unknown;
};

