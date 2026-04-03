import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { hashPassword, saveSession } from "../utils/auth";

const ALLOWED_USERS: Record<string, string> = {
  wotan: "111111",
  Michael: "123456",
};

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [loginNickname, setLoginNickname] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Navigate AFTER React has fully committed the "navigating" render to the DOM.
  // This avoids any insertBefore conflict because the form is already removed.
  useEffect(() => {
    if (navigating) {
      const timer = setTimeout(() => {
        window.location.replace("/welcome");
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [navigating]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginNickname.trim() || !loginPassword) {
      setError("Bitte alle Felder ausfüllen.");
      return;
    }
    setLoading(true);
    const expectedPassword = ALLOWED_USERS[loginNickname.trim()];
    if (expectedPassword === undefined || expectedPassword !== loginPassword) {
      setError("Ungültiger Benutzername oder Passwort.");
      setLoading(false);
      return;
    }
    const hash = await hashPassword(loginPassword);
    saveSession({ token: hash, nickname: loginNickname.trim() });
    setNavigating(true);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(0.135 0.025 248)" }}
    >
      {/* Header */}
      <header
        className="w-full"
        style={{
          background: "oklch(0.13 0.03 248 / 0.96)",
          borderBottom: "1px solid oklch(0.27 0.055 248)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "oklch(0.72 0.13 218 / 0.15)",
                border: "1px solid oklch(0.72 0.13 218 / 0.35)",
              }}
            >
              <Shield
                className="w-5 h-5"
                style={{ color: "oklch(0.72 0.13 218)" }}
              />
            </div>
            <div>
              <span
                className="font-display font-bold text-lg block"
                style={{ color: "oklch(0.96 0.015 230)" }}
              >
                SDR
              </span>
              <span
                className="block text-sm font-medium leading-none mt-0.5"
                style={{ color: "oklch(0.73 0.03 235)" }}
              >
                SichereDeineRechte
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.replace("/");
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all"
            style={{
              color: "oklch(0.72 0.13 218)",
              border: "1px solid oklch(0.72 0.13 218 / 0.35)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "oklch(0.72 0.13 218 / 0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
            data-ocid="auth.back.button"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Startseite
          </button>
        </div>
      </header>

      {/* Auth Form */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div
          className="w-full max-w-md rounded-2xl p-8"
          style={{
            background: "oklch(0.17 0.03 248)",
            border: "1px solid oklch(0.27 0.055 248)",
          }}
          data-ocid="auth.modal"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "oklch(0.72 0.13 218 / 0.15)",
                border: "1px solid oklch(0.72 0.13 218 / 0.3)",
              }}
            >
              <Shield
                className="w-5 h-5"
                style={{ color: "oklch(0.72 0.13 218)" }}
              />
            </div>
            <h1
              className="text-xl font-bold font-display"
              style={{ color: "oklch(0.96 0.015 230)" }}
            >
              SDR – SichereDeineRechte
            </h1>
          </div>

          {/* Show only spinner while navigating – no form elements in DOM */}
          {navigating ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2
                className="w-10 h-10 animate-spin"
                style={{ color: "oklch(0.72 0.13 218)" }}
              />
              <p
                className="text-base"
                style={{ color: "oklch(0.73 0.03 235)" }}
              >
                Weiterleitung…
              </p>
            </div>
          ) : (
            <>
              {/* Inline error – no portals */}
              {error && (
                <div
                  className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5"
                  style={{
                    background: "oklch(0.35 0.12 25 / 0.2)",
                    border: "1px solid oklch(0.55 0.18 25 / 0.5)",
                  }}
                >
                  <AlertCircle
                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                    style={{ color: "oklch(0.72 0.18 25)" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "oklch(0.88 0.06 25)" }}
                  >
                    {error}
                  </p>
                </div>
              )}

              {/* Login form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    className="text-base"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    Nickname
                  </Label>
                  <Input
                    value={loginNickname}
                    onChange={(e) => setLoginNickname(e.target.value)}
                    placeholder="Ihr Nickname"
                    disabled={loading}
                    autoComplete="username"
                    className="text-base"
                    style={{
                      background: "oklch(0.13 0.03 248)",
                      border: "1px solid oklch(0.27 0.055 248)",
                      color: "oklch(0.96 0.015 230)",
                    }}
                    data-ocid="auth.login.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    className="text-base"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    Passwort
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Ihr Passwort"
                      disabled={loading}
                      autoComplete="current-password"
                      className="text-base"
                      style={{
                        background: "oklch(0.13 0.03 248)",
                        border: "1px solid oklch(0.27 0.055 248)",
                        color: "oklch(0.96 0.015 230)",
                        paddingRight: "2.5rem",
                      }}
                      data-ocid="auth.login_password.input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                      style={{ color: "oklch(0.73 0.03 235)" }}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full mt-2 text-base font-semibold"
                  disabled={loading}
                  data-ocid="auth.login.submit_button"
                  style={{
                    background: "oklch(0.72 0.13 218)",
                    color: "oklch(0.135 0.025 248)",
                  }}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {loading ? "Wird angemeldet…" : "Anmelden"}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
