"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          color: "#e2e8f0",
          backgroundColor: "#08081E",
          backgroundImage:
            "radial-gradient(ellipse 90% 60% at 0% 0%, rgba(79,70,229,0.45) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 100% 10%, rgba(124,58,237,0.35) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(6,182,212,0.18) 0%, transparent 60%)",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <main style={{ padding: "32px 24px" }}>
          <div
            style={{
              maxWidth: "760px",
              margin: "64px auto 0",
              borderRadius: "24px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(16px)",
              padding: "32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "16px",
                  background: "rgba(244,63,94,0.12)",
                  border: "1px solid rgba(244,63,94,0.2)",
                }}
              >
                <AlertOctagon size={20} color="#fda4af" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#fb7185", fontWeight: 700 }}>
                  AutoApply Runtime
                </p>
                <h1 style={{ margin: "6px 0 0", fontSize: "28px", color: "#fff" }}>
                  Root shell crashed
                </h1>
              </div>
            </div>

            <p style={{ lineHeight: 1.8, color: "#cbd5e1" }}>
              Iska matlab root layout ya shell level par runtime exception aaya hai. Refresh/back par
              styling gayi hui lagegi, lekin issue asal me render crash hai.
            </p>

            <div
              style={{
                marginTop: "20px",
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                padding: "16px",
                color: "#cbd5e1",
                wordBreak: "break-word",
              }}
            >
              {error.message || "Unknown root runtime error"}
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px", flexWrap: "wrap" }}>
              <button
                onClick={reset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  height: "40px",
                  padding: "0 16px",
                  borderRadius: "12px",
                  border: 0,
                  color: "#fff",
                  cursor: "pointer",
                  background: "linear-gradient(to right, #7c3aed, #4f46e5)",
                }}
              >
                <RefreshCw size={16} />
                Retry app
              </button>
              <Link
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: "40px",
                  padding: "0 16px",
                  borderRadius: "12px",
                  color: "#e2e8f0",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  textDecoration: "none",
                }}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
