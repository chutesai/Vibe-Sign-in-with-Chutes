#!/usr/bin/env npx tsx
/**
 * Register OAuth App - Non-Interactive Script
 *
 * Register an OAuth application with Chutes programmatically.
 * Useful for CI/CD pipelines or automated setups.
 *
 * Usage:
 *   npx tsx scripts/register-oauth-app.ts \
 *     --api-key="cpk_xxx" \
 *     --name="My App" \
 *     --homepage="http://localhost:3000" \
 *     --callback="http://localhost:3000/api/auth/chutes/callback"
 *
 * Options:
 *   --api-key      Your Chutes API key (required)
 *   --name         App name (required)
 *   --description  App description (optional)
 *   --homepage     Homepage URL (required)
 *   --callback     OAuth callback URL (required)
 *   --scopes       Space-separated scopes (default: "openid profile chutes:invoke")
 *   --output       Output format: json, env, or both (default: both)
 */

// ============================================================================
// Constants
// ============================================================================

const CHUTES_API_URL = "https://api.chutes.ai";

// ============================================================================
// Types
// ============================================================================

interface OAuthAppResponse {
  app_id: string;
  client_id: string;
  client_secret: string;
  name: string;
  description: string;
  redirect_uris: string[];
  homepage_url: string;
  allowed_scopes: string[];
  active: boolean;
  public: boolean;
}

interface Args {
  apiKey: string;
  name: string;
  description?: string;
  homepage: string;
  callback: string;
  scopes: string[];
  output: "json" | "env" | "both";
}

// ============================================================================
// Argument Parsing
// ============================================================================

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const parsed: Partial<Args> = {
    scopes: ["openid", "profile", "chutes:invoke"],
    output: "both",
  };

  for (const arg of args) {
    if (arg.startsWith("--api-key=")) {
      parsed.apiKey = arg.slice("--api-key=".length);
    } else if (arg.startsWith("--name=")) {
      parsed.name = arg.slice("--name=".length);
    } else if (arg.startsWith("--description=")) {
      parsed.description = arg.slice("--description=".length);
    } else if (arg.startsWith("--homepage=")) {
      parsed.homepage = arg.slice("--homepage=".length);
    } else if (arg.startsWith("--callback=")) {
      parsed.callback = arg.slice("--callback=".length);
    } else if (arg.startsWith("--scopes=")) {
      parsed.scopes = arg.slice("--scopes=".length).split(/[\s,]+/);
    } else if (arg.startsWith("--output=")) {
      const val = arg.slice("--output=".length);
      if (val === "json" || val === "env" || val === "both") {
        parsed.output = val;
      }
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  // Validate required args
  if (!parsed.apiKey) {
    console.error("Error: --api-key is required");
    printHelp();
    process.exit(1);
  }
  if (!parsed.name) {
    console.error("Error: --name is required");
    printHelp();
    process.exit(1);
  }
  if (!parsed.homepage) {
    console.error("Error: --homepage is required");
    printHelp();
    process.exit(1);
  }
  if (!parsed.callback) {
    console.error("Error: --callback is required");
    printHelp();
    process.exit(1);
  }

  return parsed as Args;
}

function printHelp() {
  console.log(`
Register OAuth App - Non-Interactive Script

Usage:
  npx tsx scripts/register-oauth-app.ts [options]

Required Options:
  --api-key=KEY      Your Chutes API key
  --name=NAME        App name
  --homepage=URL     Homepage URL
  --callback=URL     OAuth callback URL

Optional:
  --description=TEXT App description
  --scopes=SCOPES    Space-separated scopes (default: "openid profile chutes:invoke")
  --output=FORMAT    Output format: json, env, or both (default: both)
  --help, -h         Show this help message

Example:
  npx tsx scripts/register-oauth-app.ts \\
    --api-key="cpk_xxx" \\
    --name="My App" \\
    --homepage="http://localhost:3000" \\
    --callback="http://localhost:3000/api/auth/chutes/callback"
`);
}

// ============================================================================
// API Functions
// ============================================================================

async function registerOAuthApp(args: Args): Promise<OAuthAppResponse> {
  const response = await fetch(`${CHUTES_API_URL}/idp/apps`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: args.name,
      description: args.description || `OAuth app for ${args.name}`,
      homepage_url: args.homepage,
      redirect_uris: [args.callback],
      allowed_scopes: args.scopes,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Output Formatters
// ============================================================================

function outputJson(app: OAuthAppResponse) {
  console.log(JSON.stringify(app, null, 2));
}

function outputEnv(app: OAuthAppResponse, scopes: string[]) {
  console.log(`# Chutes OAuth Configuration`);
  console.log(`CHUTES_OAUTH_CLIENT_ID=${app.client_id}`);
  console.log(`CHUTES_OAUTH_CLIENT_SECRET=${app.client_secret}`);
  console.log(`CHUTES_OAUTH_SCOPES="${scopes.join(" ")}"`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = parseArgs();

  try {
    const app = await registerOAuthApp(args);

    if (args.output === "json") {
      outputJson(app);
    } else if (args.output === "env") {
      outputEnv(app, args.scopes);
    } else {
      console.log("=== OAuth App Registered ===\n");
      outputJson(app);
      console.log("\n=== Environment Variables ===\n");
      outputEnv(app, args.scopes);
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

