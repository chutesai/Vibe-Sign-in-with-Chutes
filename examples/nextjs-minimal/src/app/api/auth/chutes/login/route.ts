/**
 * Login Route - Initiates OAuth flow
 */

import { NextResponse } from "next/server";
import {
  buildAuthorizeUrl,
  generatePkce,
  generateState,
  getOAuthConfig,
} from "@/lib/chutesAuth";

const isProd = process.env.NODE_ENV === "production";
const cookieBase = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
};

export async function GET(req: Request) {
  try {
    const origin = new URL(req.url).origin;
    const config = getOAuthConfig(origin);
    const state = generateState();
    const { verifier, challenge } = generatePkce();
    const authorizeUrl = buildAuthorizeUrl({
      state,
      codeChallenge: challenge,
      config,
    });

    const res = NextResponse.redirect(authorizeUrl);

    res.cookies.set("chutes_oauth_state", state, {
      ...cookieBase,
      maxAge: 300,
    });
    res.cookies.set("chutes_pkce_verifier", verifier, {
      ...cookieBase,
      maxAge: 300,
    });

    return res;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start Chutes login";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

