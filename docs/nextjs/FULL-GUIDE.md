# Full Guide: Sign in with Chutes (Next.js)

Complete reference for integrating Chutes OAuth into your Next.js application.

## Table of Contents

1. [OAuth Configuration](#oauth-configuration)
2. [Environment Variables](#environment-variables)
3. [Core Files Reference](#core-files-reference)
4. [Customization](#customization)
5. [Advanced Usage](#advanced-usage)
6. [Security Best Practices](#security-best-practices)

---

## OAuth Configuration

### Registering Your App

You can register an OAuth app via the setup wizard or programmatically:

**Interactive (Recommended):**

```bash
npx tsx scripts/setup-chutes-app.ts
```

**Programmatic:**

```bash
npx tsx scripts/register-oauth-app.ts \
  --api-key="cpk_xxx" \
  --name="My App" \
  --homepage="https://myapp.com" \
  --callback="https://myapp.com/api/auth/chutes/callback"
```

**Direct API Call:**

```bash
curl -X POST "https://api.chutes.ai/idp/apps" \
  -H "Authorization: Bearer $CHUTES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App",
    "description": "My app description",
    "redirect_uris": ["https://myapp.com/api/auth/chutes/callback"],
    "homepage_url": "https://myapp.com",
    "allowed_scopes": ["openid", "profile", "chutes:invoke"]
  }'
```

### Available Scopes

| Scope                      | Description                     | Required             |
| -------------------------- | ------------------------------- | -------------------- |
| `openid`                   | OpenID Connect authentication   | Yes                  |
| `profile`                  | Access to username, email, name | Recommended          |
| `chutes:invoke`            | Make AI API calls               | If using AI features |
| `chutes:invoke:{chute_id}` | Invoke specific chute only      | Optional             |
| `account:read`             | Read account information        | Optional             |
| `billing:read`             | Read balance/credits            | Optional             |

---

## Environment Variables

### Required

```bash
# OAuth Client Credentials (from app registration)
CHUTES_OAUTH_CLIENT_ID=cid_xxx
CHUTES_OAUTH_CLIENT_SECRET=csc_xxx
```

### Optional

```bash
# Override the default scopes
CHUTES_OAUTH_SCOPES="openid profile chutes:invoke billing:read"

# Explicitly set the redirect URI (auto-detected if not set)
CHUTES_OAUTH_REDIRECT_URI=https://myapp.com/api/auth/chutes/callback

# App URL for redirect URI construction
NEXT_PUBLIC_APP_URL=https://myapp.com

# Override IDP base URL (rarely needed)
CHUTES_IDP_BASE_URL=https://api.chutes.ai
```

---

## Core Files Reference

### `lib/chutesAuth.ts`

Core OAuth utilities:

```typescript
// Get OAuth configuration
const config = getOAuthConfig(requestOrigin);

// Generate PKCE pair
const { verifier, challenge } = generatePkce();

// Generate state for CSRF protection
const state = generateState();

// Build authorization URL
const url = buildAuthorizeUrl({ state, codeChallenge, config });

// Exchange code for tokens
const tokens = await exchangeCodeForTokens({ code, codeVerifier, config });

// Refresh expired tokens
const newTokens = await refreshTokens({ refreshToken, config });

// Fetch user info
const user = await fetchUserInfo(config, accessToken);
```

### `lib/serverAuth.ts`

Server-side helpers:

```typescript
// Get access token from cookies
const token = await getServerAccessToken();

// Get refresh token from cookies
const refreshToken = await getServerRefreshToken();

// Get cached user info
const user = await getServerUserInfo();

// Check if authenticated
const isAuth = await isAuthenticated();

// Clear all session cookies (for logout)
clearSessionCookies(response.headers);
```

### `hooks/useChutesSession.ts`

React hook for client-side auth state:

```typescript
const {
  isSignedIn, // boolean - whether user is authenticated
  user, // ChutesUser | null - user profile
  loading, // boolean - initial load state
  loginUrl, // string - URL to redirect for login
  refresh, // () => Promise<void> - refresh session
  logout, // () => Promise<void> - log out user
} = useChutesSession();
```

---

## Customization

### Custom Sign In Button

```tsx
"use client";

import { useChutesSession } from "@/hooks/useChutesSession";

export function CustomSignInButton() {
  const { loginUrl, loading } = useChutesSession();

  return (
    <a
      href={loginUrl}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 24px",
        backgroundColor: "#00DC82",
        color: "#000",
        borderRadius: "8px",
        fontWeight: 600,
        textDecoration: "none",
        opacity: loading ? 0.5 : 1,
      }}
    >
      {/* Your custom logo/icon */}
      <YourLogo />
      Sign in with Chutes
    </a>
  );
}
```

### Custom Post-Login Redirect

Modify `callback/route.ts` to redirect to a custom page:

```typescript
// Instead of:
const res = NextResponse.redirect(new URL("/", req.url));

// Redirect to a specific page:
const res = NextResponse.redirect(new URL("/dashboard", req.url));

// Or redirect to the page they were on:
const returnTo = cookieStore.get("return_to")?.value || "/";
const res = NextResponse.redirect(new URL(returnTo, req.url));
```

### Adding Return URL Support

Store the current URL before redirecting to login:

```typescript
// In your login trigger
localStorage.setItem("returnTo", window.location.pathname);

// In callback/route.ts, read it back and redirect
```

Or use a cookie-based approach in the login route.

---

## Advanced Usage

### Token Refresh

The access token expires after about 1 hour. To handle refresh:

```typescript
import { getServerAccessToken, getServerRefreshToken } from "@/lib/serverAuth";
import { refreshTokens, getOAuthConfig } from "@/lib/chutesAuth";

async function getValidToken(): Promise<string | null> {
  const token = await getServerAccessToken();

  if (token) {
    // Token exists, assume valid (you could validate it)
    return token;
  }

  // Try to refresh
  const refreshToken = await getServerRefreshToken();
  if (!refreshToken) {
    return null; // Not authenticated
  }

  try {
    const config = getOAuthConfig();
    const newTokens = await refreshTokens({ refreshToken, config });

    // You'd need to set the new tokens in cookies here
    // This requires returning a Response object
    return newTokens.access_token;
  } catch {
    return null; // Refresh failed
  }
}
```

### Middleware Protection

Protect routes with Next.js middleware:

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("chutes_access_token");

  // Protect /dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

### Using with Vercel AI SDK

```typescript
import { createChutes } from "@chutes-ai/ai-sdk-provider";
import { generateText, streamText } from "ai";
import { getServerAccessToken } from "@/lib/serverAuth";

export async function POST(req: Request) {
  const token = await getServerAccessToken();

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chutes = createChutes({ apiKey: token });
  const { message } = await req.json();

  // Non-streaming
  const { text } = await generateText({
    model: chutes("deepseek-ai/DeepSeek-V3-0324"),
    prompt: message,
  });

  return Response.json({ text });
}
```

---

## Security Best Practices

### 1. Keep Secrets Server-Side

Never expose `CHUTES_OAUTH_CLIENT_SECRET` to the client. All token operations should happen in API routes.

### 2. Use HttpOnly Cookies

All auth cookies are set with `httpOnly: true` to prevent XSS attacks.

### 3. Validate State Parameter

The callback route validates the `state` parameter to prevent CSRF attacks. Don't skip this check.

### 4. Use PKCE

PKCE (Proof Key for Code Exchange) prevents authorization code interception. The implementation handles this automatically.

### 5. HTTPS in Production

Set `secure: true` on cookies in production. This is handled by checking `NODE_ENV`.

### 6. Limit Scope Requests

Only request the scopes you actually need. Don't request `billing:read` if you don't need it.

### 7. Handle Token Expiry

Access tokens expire. Implement token refresh or prompt users to re-authenticate.

---

## API Reference

### Chutes IDP Endpoints

| Endpoint                | Method | Description              |
| ----------------------- | ------ | ------------------------ |
| `/idp/authorize`        | GET    | Start OAuth flow         |
| `/idp/token`            | POST   | Exchange code for tokens |
| `/idp/userinfo`         | GET    | Get user profile         |
| `/idp/token/introspect` | POST   | Validate token           |
| `/idp/apps`             | POST   | Register OAuth app       |
| `/users/me`             | GET    | Detailed user info       |

### OpenID Configuration

```
https://idp.chutes.ai/.well-known/openid-configuration
```

---

## Related Documentation

- [Architecture](../../ARCHITECTURE.md) - OAuth flow details
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues
- [Chutes API Docs](https://docs.chutes.ai) - Full API reference
