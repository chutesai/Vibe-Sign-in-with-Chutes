# Sign in with Chutes

> **One-stop SDK for adding Chutes OAuth authentication to any app**

Add "Sign in with Chutes" to your app in under 5 minutes. This repo provides copy-paste code, automation scripts, and a working example to integrate Chutes OAuth into your application.

## What is Chutes?

[Chutes.ai](https://chutes.ai) is a serverless AI compute platform offering cheap, open-source AI models. With "Sign in with Chutes", users authenticate with their Chutes account and your app can make AI API calls on their behalf—no API key management needed.

## Quick Start (Next.js)

### 1. Register Your OAuth App

```bash
# Install dependencies and run the setup wizard
npm install
npx tsx scripts/setup-chutes-app.ts
```

This will prompt you for your Chutes API key and app details, then generate your OAuth credentials.

### 2. Copy the Integration Files

Copy these files into your Next.js project:

```
packages/nextjs/
├── lib/
│   ├── chutesAuth.ts      → src/lib/chutesAuth.ts
│   └── serverAuth.ts      → src/lib/serverAuth.ts
├── hooks/
│   └── useChutesSession.ts → src/hooks/useChutesSession.ts
├── api/auth/chutes/
│   ├── login.ts           → src/app/api/auth/chutes/login/route.ts
│   ├── callback.ts        → src/app/api/auth/chutes/callback/route.ts
│   ├── logout.ts          → src/app/api/auth/chutes/logout/route.ts
│   └── session.ts         → src/app/api/auth/chutes/session/route.ts
└── components/
    └── SignInButton.tsx   → src/components/SignInButton.tsx
```

### 3. Set Environment Variables

```bash
# .env.local
CHUTES_OAUTH_CLIENT_ID=cid_xxx
CHUTES_OAUTH_CLIENT_SECRET=csc_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Add the Sign In Button

```tsx
import { SignInButton } from "@/components/SignInButton";
import { useChutesSession } from "@/hooks/useChutesSession";

export default function Page() {
  const { isSignedIn, user, logout } = useChutesSession();

  if (isSignedIn) {
    return (
      <div>
        <p>Welcome, {user?.username}!</p>
        <button onClick={logout}>Sign Out</button>
      </div>
    );
  }

  return <SignInButton />;
}
```

That's it! Your users can now sign in with their Chutes account.

---

## Repository Structure

```
├── README.md                 # This file
├── ARCHITECTURE.md           # OAuth flow diagrams & explanation
├── packages/
│   └── nextjs/               # Copy-paste integration files
│       ├── lib/              # Core auth utilities
│       ├── hooks/            # React hooks
│       ├── api/              # API route handlers
│       └── components/       # UI components
├── scripts/
│   ├── setup-chutes-app.ts   # Interactive setup wizard
│   ├── register-oauth-app.ts # Direct OAuth app registration
│   └── verify-setup.ts       # Validate your configuration
├── examples/
│   └── nextjs-minimal/       # Working demo app
├── docs/
│   └── nextjs/
│       ├── QUICKSTART.md     # 5-minute guide
│       ├── FULL-GUIDE.md     # Complete reference
│       └── TROUBLESHOOTING.md
└── .env.example              # Environment template
```

---

## OAuth Scopes

When registering your app, you can request these scopes:

| Scope           | Description                                     |
| --------------- | ----------------------------------------------- |
| `openid`        | Required. Enables OpenID Connect authentication |
| `profile`       | Access to username, email, name                 |
| `chutes:invoke` | Make AI API calls on behalf of the user         |
| `account:read`  | Read account information                        |
| `billing:read`  | Read billing/credits information                |

Default: `openid profile chutes:invoke`

---

## Using AI After Authentication

Once authenticated, you can use the access token to make AI API calls:

```typescript
// In an API route
import { getServerAccessToken } from "@/lib/serverAuth";

export async function POST(req: Request) {
  const token = await getServerAccessToken();

  if (!token) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const response = await fetch("https://api.chutes.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-ai/DeepSeek-V3-0324",
      messages: [{ role: "user", content: "Hello!" }],
    }),
  });

  return Response.json(await response.json());
}
```

Or use the `@chutes-ai/ai-sdk-provider` with Vercel AI SDK:

```typescript
import { createChutes } from "@chutes-ai/ai-sdk-provider";
import { generateText } from "ai";
import { getServerAccessToken } from "@/lib/serverAuth";

export async function POST(req: Request) {
  const token = await getServerAccessToken();
  const chutes = createChutes({ apiKey: token! });

  const { text } = await generateText({
    model: chutes("deepseek-ai/DeepSeek-V3-0324"),
    prompt: "Hello!",
  });

  return Response.json({ text });
}
```

---

## Framework Support

| Framework              | Status         |
| ---------------------- | -------------- |
| Next.js (App Router)   | ✅ Available   |
| Next.js (Pages Router) | 🔜 Coming soon |
| Express.js             | 🔜 Coming soon |
| Python/FastAPI         | 🔜 Coming soon |

---

## Resources

- [Chutes.ai](https://chutes.ai) - Platform homepage
- [Chutes Documentation](https://docs.chutes.ai) - API reference
- [OpenID Configuration](https://idp.chutes.ai/.well-known/openid-configuration) - OAuth discovery endpoint
- [Get API Key](https://chutes.ai/app/api-keys) - For registering OAuth apps
- [@chutes-ai/ai-sdk-provider](https://www.npmjs.com/package/@chutes-ai/ai-sdk-provider) - Vercel AI SDK provider

---

## License

MIT License - see [LICENSE](LICENSE) for details.
