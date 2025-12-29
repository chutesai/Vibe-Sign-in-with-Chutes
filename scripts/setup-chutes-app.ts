#!/usr/bin/env npx tsx
/**
 * Sign in with Chutes - Interactive Setup Wizard
 *
 * This script guides you through registering your OAuth application with Chutes
 * and generates the necessary environment variables.
 *
 * Usage:
 *   npx tsx scripts/setup-chutes-app.ts
 *
 * Requirements:
 *   - A Chutes API key (get one at https://chutes.ai/app/api-keys)
 */

import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

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

// ============================================================================
// Helpers
// ============================================================================

function createReadline(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function prompt(
  rl: readline.Interface,
  question: string
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function printHeader() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                                                            ║");
  console.log("║           🚀 Sign in with Chutes - Setup Wizard            ║");
  console.log("║                                                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\n");
}

function printSuccess(clientId: string, clientSecret: string) {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                    ✅ Setup Complete!                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\n");
  console.log("Your OAuth credentials have been saved to .env.local\n");
  console.log("  CHUTES_OAUTH_CLIENT_ID=" + clientId.slice(0, 20) + "...");
  console.log(
    "  CHUTES_OAUTH_CLIENT_SECRET=" + clientSecret.slice(0, 10) + "...\n"
  );
  console.log("Next steps:");
  console.log(
    "  1. Copy the integration files from packages/nextjs/ to your project"
  );
  console.log("  2. Start your development server: npm run dev");
  console.log(
    "  3. Visit http://localhost:3000 and click 'Sign in with Chutes'\n"
  );
}

function printError(message: string) {
  console.error("\n❌ Error:", message);
}

// ============================================================================
// API Functions
// ============================================================================

async function registerOAuthApp(params: {
  apiKey: string;
  name: string;
  description: string;
  homepageUrl: string;
  redirectUris: string[];
  scopes: string[];
}): Promise<OAuthAppResponse> {
  const response = await fetch(`${CHUTES_API_URL}/idp/apps`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: params.name,
      description: params.description,
      homepage_url: params.homepageUrl,
      redirect_uris: params.redirectUris,
      allowed_scopes: params.scopes,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

async function verifyApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${CHUTES_API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  printHeader();

  const rl = createReadline();

  try {
    // Step 1: Get API Key
    console.log("Step 1/4: API Key");
    console.log("─────────────────");
    console.log("You need a Chutes API key to register OAuth apps.");
    console.log("Get one at: https://chutes.ai/app/api-keys\n");

    const apiKey = await prompt(rl, "Enter your Chutes API key: ");

    if (!apiKey) {
      printError("API key is required");
      process.exit(1);
    }

    console.log("\nVerifying API key...");
    const isValid = await verifyApiKey(apiKey);
    if (!isValid) {
      printError("Invalid API key. Please check and try again.");
      process.exit(1);
    }
    console.log("✓ API key verified\n");

    // Step 2: App Name & Description
    console.log("Step 2/4: App Details");
    console.log("─────────────────────");

    const appName = await prompt(rl, "App name (e.g., 'My Awesome App'): ");
    if (!appName) {
      printError("App name is required");
      process.exit(1);
    }

    const description = await prompt(
      rl,
      "Description (optional, press Enter to skip): "
    );

    // Step 3: URLs
    console.log("\nStep 3/4: URLs");
    console.log("──────────────");
    console.log("For local development, use http://localhost:3000");
    console.log(
      "For production, use your actual domain (e.g., https://myapp.com)\n"
    );

    const homepageUrl =
      (await prompt(rl, "Homepage URL [http://localhost:3000]: ")) ||
      "http://localhost:3000";

    const defaultCallback = `${homepageUrl.replace(
      /\/$/,
      ""
    )}/api/auth/chutes/callback`;
    const callbackUrl =
      (await prompt(rl, `Callback URL [${defaultCallback}]: `)) ||
      defaultCallback;

    // Step 4: Scopes
    console.log("\nStep 4/4: Permissions (Scopes)");
    console.log("──────────────────────────────");
    console.log("Available scopes:");
    console.log("  - openid: Required for authentication");
    console.log("  - profile: Access to username, email, name");
    console.log("  - chutes:invoke: Make AI API calls on behalf of user");
    console.log("  - account:read: Read account information");
    console.log("  - billing:read: Read balance/credits\n");

    const defaultScopes = "openid profile chutes:invoke";
    const scopesInput =
      (await prompt(rl, `Scopes [${defaultScopes}]: `)) || defaultScopes;
    const scopes = scopesInput.split(/[\s,]+/).filter(Boolean);

    // Register the app
    console.log("\nRegistering OAuth application...");

    const app = await registerOAuthApp({
      apiKey,
      name: appName,
      description: description || `OAuth app for ${appName}`,
      homepageUrl,
      redirectUris: [callbackUrl],
      scopes,
    });

    // Generate .env.local file
    const envContent = `# Chutes OAuth Configuration
# Generated by setup-chutes-app.ts on ${new Date().toISOString()}

# OAuth Client Credentials (keep these secret!)
CHUTES_OAUTH_CLIENT_ID=${app.client_id}
CHUTES_OAUTH_CLIENT_SECRET=${app.client_secret}

# OAuth Scopes
CHUTES_OAUTH_SCOPES="${scopes.join(" ")}"

# App URL (used for redirect URI construction)
NEXT_PUBLIC_APP_URL=${homepageUrl}
`;

    // Determine output path
    let outputPath = ".env.local";

    // Check if we're in the root repo or in an example app
    if (fs.existsSync("examples/nextjs-minimal")) {
      // We're in the root, ask where to save
      const saveToExample = await prompt(
        rl,
        "\nSave to examples/nextjs-minimal/.env.local? (Y/n): "
      );
      if (saveToExample.toLowerCase() !== "n") {
        outputPath = "examples/nextjs-minimal/.env.local";
      }
    }

    fs.writeFileSync(outputPath, envContent);

    printSuccess(app.client_id, app.client_secret);

    // Also print the raw credentials for reference
    console.log("📋 Raw credentials (copy these somewhere safe):");
    console.log("─".repeat(50));
    console.log(`Client ID:     ${app.client_id}`);
    console.log(`Client Secret: ${app.client_secret}`);
    console.log(`App ID:        ${app.app_id}`);
    console.log("─".repeat(50));
    console.log("\n");
  } catch (error) {
    printError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
