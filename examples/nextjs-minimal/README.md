# Sign in with Chutes - Minimal Example

A minimal Next.js app demonstrating "Sign in with Chutes" authentication.

## Quick Start

### 1. Register Your OAuth App

From the repository root:

```bash
npm install
npx tsx scripts/setup-chutes-app.ts
```

This will generate your OAuth credentials and save them to `.env.local`.

### 2. Install Dependencies

```bash
cd examples/nextjs-minimal
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

### 4. Open the App

Visit [http://localhost:3000](http://localhost:3000) and click "Sign in with Chutes"!

## What's Included

This example includes:

- **OAuth Authentication** - Complete PKCE flow with Chutes IDP
- **Session Management** - HttpOnly cookie-based sessions
- **User Display** - Shows authenticated user info
- **AI Demo** - Makes an AI API call after authentication

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/chutes/
│   │   │   ├── login/route.ts     # Start OAuth flow
│   │   │   ├── callback/route.ts  # Handle callback
│   │   │   ├── session/route.ts   # Get session state
│   │   │   └── logout/route.ts    # Clear session
│   │   └── chat/route.ts          # Demo AI endpoint
│   ├── layout.tsx
│   └── page.tsx                   # Main demo page
├── hooks/
│   └── useChutesSession.ts        # React hook for auth state
└── lib/
    ├── chutesAuth.ts              # OAuth utilities
    └── serverAuth.ts              # Server-side helpers
```

## Customization

The integration files in `src/lib/` and `src/hooks/` can be copied directly to your own project. Just update the import paths as needed.

See the main [README](../../README.md) for full documentation.

