/**
 * Sign In Button Component
 *
 * A ready-to-use button for "Sign in with Chutes" authentication.
 * Copy this file to: src/components/SignInButton.tsx
 *
 * @example
 * ```tsx
 * import { SignInButton } from "@/components/SignInButton";
 *
 * export default function LoginPage() {
 *   return (
 *     <div>
 *       <h1>Welcome</h1>
 *       <SignInButton />
 *     </div>
 *   );
 * }
 * ```
 */

"use client";

import { useChutesSession } from "@/hooks/useChutesSession";

// ============================================================================
// Types
// ============================================================================

type SignInButtonProps = {
  /** Custom button text (default: "Sign in with Chutes") */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Button variant */
  variant?: "default" | "outline" | "minimal";
};

// ============================================================================
// Styles
// ============================================================================

const baseStyles = `
  inline-flex items-center justify-center gap-2
  font-medium transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
`;

const variantStyles = {
  default: `
    px-6 py-3 rounded-lg
    bg-[#00DC82] text-black
    hover:bg-[#00c474]
    focus:ring-[#00DC82]
  `,
  outline: `
    px-6 py-3 rounded-lg
    border-2 border-[#00DC82] text-[#00DC82]
    hover:bg-[#00DC82] hover:text-black
    focus:ring-[#00DC82]
  `,
  minimal: `
    px-4 py-2 rounded
    text-[#00DC82]
    hover:bg-[#00DC82]/10
    focus:ring-[#00DC82]
  `,
};

// ============================================================================
// Chutes Logo SVG
// ============================================================================

function ChutesLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

// ============================================================================
// Component
// ============================================================================

export function SignInButton({
  children,
  className = "",
  variant = "default",
}: SignInButtonProps) {
  const { loginUrl, loading } = useChutesSession();

  return (
    <a
      href={loginUrl}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      aria-disabled={loading}
    >
      <ChutesLogo />
      {children || "Sign in with Chutes"}
    </a>
  );
}

// ============================================================================
// Additional Exports
// ============================================================================

/**
 * Sign Out Button for authenticated users.
 */
export function SignOutButton({
  children,
  className = "",
  variant = "minimal",
}: SignInButtonProps) {
  const { logout, loading } = useChutesSession();

  return (
    <button
      onClick={logout}
      disabled={loading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children || "Sign Out"}
    </button>
  );
}

/**
 * User Avatar/Info display for authenticated users.
 */
export function UserInfo({ className = "" }: { className?: string }) {
  const { isSignedIn, user, loading } = useChutesSession();

  if (loading) {
    return <div className={`animate-pulse bg-gray-200 rounded-full w-8 h-8 ${className}`} />;
  }

  if (!isSignedIn || !user) {
    return null;
  }

  const displayName = user.username || user.name || user.email || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 rounded-full bg-[#00DC82] text-black flex items-center justify-center text-sm font-medium">
        {initials}
      </div>
      <span className="text-sm font-medium">{displayName}</span>
    </div>
  );
}

