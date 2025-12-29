"use client";

import { useChutesSession } from "@/hooks/useChutesSession";
import { useState } from "react";

export default function Home() {
  const { isSignedIn, user, loading, loginUrl, logout } = useChutesSession();
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const testAI = async () => {
    setChatLoading(true);
    setChatResponse(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Say hello in a creative way!" }),
      });
      const data = await res.json();
      setChatResponse(data.text || data.error || "No response");
    } catch (err) {
      setChatResponse(`Error: ${err}`);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <main style={{
      maxWidth: "600px",
      margin: "0 auto",
      padding: "4rem 2rem",
      textAlign: "center",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "3rem" }}>
        <h1 style={{ 
          fontSize: "2.5rem", 
          fontWeight: 700, 
          marginBottom: "0.5rem",
          background: "linear-gradient(135deg, #00DC82, #36e4da)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Sign in with Chutes
        </h1>
        <p style={{ color: "#888", fontSize: "1.1rem" }}>
          Minimal authentication demo
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          padding: "2rem",
          backgroundColor: "#1a1a1a",
          borderRadius: "12px",
          border: "1px solid #333",
        }}>
          <p>Loading session...</p>
        </div>
      )}

      {/* Signed Out State */}
      {!loading && !isSignedIn && (
        <div style={{
          padding: "2rem",
          backgroundColor: "#1a1a1a",
          borderRadius: "12px",
          border: "1px solid #333",
        }}>
          <p style={{ marginBottom: "1.5rem", color: "#888" }}>
            Click below to authenticate with your Chutes account
          </p>
          <a
            href={loginUrl}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.875rem 1.5rem",
              backgroundColor: "#00DC82",
              color: "#000",
              fontWeight: 600,
              fontSize: "1rem",
              borderRadius: "8px",
              textDecoration: "none",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 220, 130, 0.4)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Sign in with Chutes
          </a>
        </div>
      )}

      {/* Signed In State */}
      {!loading && isSignedIn && (
        <div style={{
          padding: "2rem",
          backgroundColor: "#1a1a1a",
          borderRadius: "12px",
          border: "1px solid #00DC82",
        }}>
          {/* User Info */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "#00DC82",
              color: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "1.2rem",
            }}>
              {(user?.username || user?.email || "U").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "1.1rem" }}>
                {user?.username || user?.name || "Chutes User"}
              </p>
              <p style={{ margin: 0, color: "#888", fontSize: "0.9rem" }}>
                {user?.email || "Authenticated via OAuth"}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: "rgba(0, 220, 130, 0.1)",
            borderRadius: "20px",
            marginBottom: "1.5rem",
          }}>
            <span style={{ color: "#00DC82" }}>●</span>
            <span style={{ color: "#00DC82", fontSize: "0.9rem" }}>Authenticated</span>
          </div>

          {/* Test AI Button */}
          <div style={{ marginBottom: "1rem" }}>
            <button
              onClick={testAI}
              disabled={chatLoading}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#333",
                color: "#fff",
                border: "1px solid #444",
                borderRadius: "8px",
                cursor: chatLoading ? "not-allowed" : "pointer",
                fontSize: "0.95rem",
                marginRight: "0.5rem",
              }}
            >
              {chatLoading ? "Calling AI..." : "Test AI Call"}
            </button>
            <button
              onClick={logout}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "transparent",
                color: "#888",
                border: "1px solid #333",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.95rem",
              }}
            >
              Sign Out
            </button>
          </div>

          {/* AI Response */}
          {chatResponse && (
            <div style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "#0a0a0a",
              borderRadius: "8px",
              textAlign: "left",
              fontSize: "0.9rem",
              color: "#ccc",
            }}>
              <strong>AI Response:</strong>
              <p style={{ margin: "0.5rem 0 0 0" }}>{chatResponse}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={{ marginTop: "3rem", color: "#666", fontSize: "0.85rem" }}>
        <p>
          Powered by{" "}
          <a
            href="https://chutes.ai"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#00DC82", textDecoration: "none" }}
          >
            Chutes.ai
          </a>
        </p>
      </footer>
    </main>
  );
}

