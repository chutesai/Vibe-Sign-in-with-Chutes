/**
 * Logout Route - Clears session cookies
 */

import { NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";
const baseCookie = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
};

export async function POST() {
  const res = NextResponse.json({ ok: true });

  res.cookies.set("chutes_access_token", "", { ...baseCookie, maxAge: 0 });
  res.cookies.set("chutes_refresh_token", "", { ...baseCookie, maxAge: 0 });
  res.cookies.set("chutes_userinfo", "", { ...baseCookie, maxAge: 0 });
  res.cookies.set("chutes_oauth_state", "", { ...baseCookie, maxAge: 0 });
  res.cookies.set("chutes_pkce_verifier", "", { ...baseCookie, maxAge: 0 });

  return res;
}

