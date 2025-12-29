/**
 * Callback Route - Handles OAuth callback and token exchange
 */

import { NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  fetchUserInfo,
  getOAuthConfig,
} from "@/lib/chutesAuth";
import { cookies } from "next/headers";

const isProd = process.env.NODE_ENV === "production";
const cookieBase = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    return NextResponse.json({ error, errorDescription }, { status: 400 });
  }

  try {
    const origin = new URL(req.url).origin;
    const config = getOAuthConfig(origin);
    const cookieStore = await cookies();
    const storedState = cookieStore.get("chutes_oauth_state")?.value;
    const codeVerifier = cookieStore.get("chutes_pkce_verifier")?.value;

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state" },
        { status: 400 }
      );
    }

    if (!storedState || state !== storedState) {
      return NextResponse.json({ error: "Invalid state" }, { status: 400 });
    }

    if (!codeVerifier) {
      return NextResponse.json(
        { error: "Missing PKCE verifier" },
        { status: 400 }
      );
    }

    const tokenResult = await exchangeCodeForTokens({
      code,
      codeVerifier,
      config,
    });

    const accessToken = tokenResult.access_token;
    const refreshToken = tokenResult.refresh_token;
    const expiresIn = tokenResult.expires_in ?? 3600;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token returned" },
        { status: 500 }
      );
    }

    const res = NextResponse.redirect(new URL("/", req.url));

    res.cookies.set("chutes_access_token", accessToken, {
      ...cookieBase,
      maxAge: expiresIn,
    });

    if (refreshToken) {
      res.cookies.set("chutes_refresh_token", refreshToken, {
        ...cookieBase,
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    try {
      const userinfo = await fetchUserInfo(config, accessToken);
      if (userinfo) {
        res.cookies.set("chutes_userinfo", JSON.stringify(userinfo), {
          ...cookieBase,
          maxAge: expiresIn,
        });
      }
    } catch {
      // Ignore userinfo fetch failures
    }

    res.cookies.set("chutes_oauth_state", "", { ...cookieBase, maxAge: 0 });
    res.cookies.set("chutes_pkce_verifier", "", { ...cookieBase, maxAge: 0 });

    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Callback failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

