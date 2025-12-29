import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in with Chutes - Demo",
  description: "Minimal example of Sign in with Chutes authentication",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ 
        margin: 0, 
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: "#0a0a0a",
        color: "#ededed",
        minHeight: "100vh",
      }}>
        {children}
      </body>
    </html>
  );
}

