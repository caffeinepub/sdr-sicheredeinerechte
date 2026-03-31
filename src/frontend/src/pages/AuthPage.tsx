import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { backend } from "../backendActor";
import { hashPassword, saveSession } from "../utils/auth";

export default function AuthPage() {
  const search = useSearch({ from: "/auth" }) as { tab?: string };
  const defaultMode = search.tab === "login" ? "login" : "register";

  const [mode, setMode] = useState<"register" | "login">(defaultMode);
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [regNickname, setRegNickname] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const [loginNickname, setLoginNickname] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Navigate AFTER React has fully committed the "navigating" render to the DOM.
  // This avoids any insertBefore conflict because the form is already removed.
  useEffect(() => {
    if (navigating) {
      window.location.replace("/welcome");
    }
  }, [navigating]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!regNickname.trim()) {
      setError("Bitte geben Sie einen Nicknamen ein.");
      return;
    }
    if (regPassword.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (regPassword !== regConfirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }
    setLoading(true);
    try {
      const hash = await hashPassword(regPassword);
      const result = await backend.register(regNickname.trim(), hash);
      if ("error" in result) {
        setError(String(result.error));
        setLoading(false);
        return;
      }
      const loginResult = await backend.login(regNickname.trim(), hash);
      if ("error" in loginResult) {
        setError(String(loginResult.error));
        setLoading(false);
        return;
      }
      saveSession({
        token: String(loginResult.ok),
        nickname: regNickname.trim(),
      });
      // Replace entire form with spinner FIRST, then navigate in useEffect
      setNavigating(true);
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte erneut versuchen.");
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginNickname.trim() || !loginPassword) {
      setError("Bitte alle Felder ausfüllen.");
      return;
    }
    setLoading(true);
    try {
      const hash = await hashPassword(loginPassword);
      const result = await backend.login(loginNickname.trim(), hash);
      if ("error" in result) {
        setError("Ungültiger Benutzername oder Passwort.");
        setLoading(false);
        return;
      }
      saveSession({ token: String(result.ok), nickname: loginNickname.trim() });
      // Replace entire form with spinner FIRST, then navigate in useEffect
      setNavigating(true);
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte erneut versuchen.");
      setLoading(false);
    }
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
              {/* Tab toggle */}
              <div
                className="grid grid-cols-2 rounded-xl p-1 mb-6"
                style={{
                  background: "oklch(0.13 0.03 248)",
                  border: "1px solid oklch(0.27 0.055 248)",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  className="py-2 rounded-lg text-base font-medium transition-all"
                  style={{
                    background:
                      mode === "register"
                        ? "oklch(0.72 0.13 218)"
                        : "transparent",
                    color:
                      mode === "register"
                        ? "oklch(0.135 0.025 248)"
                        : "oklch(0.73 0.03 235)",
                  }}
                  data-ocid="auth.register.tab"
                >
                  Registrieren
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className="py-2 rounded-lg text-base font-medium transition-all"
                  style={{
                    background:
                      mode === "login" ? "oklch(0.72 0.13 218)" : "transparent",
                    color:
                      mode === "login"
                        ? "oklch(0.135 0.025 248)"
                        : "oklch(0.73 0.03 235)",
                  }}
                  data-ocid="auth.login.tab"
                >
                  Anmelden
                </button>
              </div>

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

              {/* Register form */}
              {mode === "register" && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      className="text-base"
                      style={{ color: "oklch(0.73 0.03 235)" }}
                    >
                      Nickname
                    </Label>
                    <Input
                      value={regNickname}
                      onChange={(e) => setRegNickname(e.target.value)}
                      placeholder="Ihr Nickname"
                      disabled={loading}
                      autoComplete="username"
                      className="text-base"
                      style={{
                        background: "oklch(0.13 0.03 248)",
                        border: "1px solid oklch(0.27 0.055 248)",
                        color: "oklch(0.96 0.015 230)",
                      }}
                      data-ocid="auth.register.input"
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
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mindestens 6 Zeichen"
                        disabled={loading}
                        autoComplete="new-password"
                        className="text-base"
                        style={{
                          background: "oklch(0.13 0.03 248)",
                          border: "1px solid oklch(0.27 0.055 248)",
                          color: "oklch(0.96 0.015 230)",
                          paddingRight: "2.5rem",
                        }}
                        data-ocid="auth.password.input"
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
                  <div className="space-y-1.5">
                    <Label
                      className="text-base"
                      style={{ color: "oklch(0.73 0.03 235)" }}
                    >
                      Passwort bestätigen
                    </Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      placeholder="Passwort wiederholen"
                      disabled={loading}
                      autoComplete="new-password"
                      className="text-base"
                      style={{
                        background: "oklch(0.13 0.03 248)",
                        border: "1px solid oklch(0.27 0.055 248)",
                        color: "oklch(0.96 0.015 230)",
                      }}
                      data-ocid="auth.confirm_password.input"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full mt-2 text-base font-semibold"
                    disabled={loading}
                    data-ocid="auth.register.submit_button"
                    style={{
                      background: "oklch(0.72 0.13 218)",
                      color: "oklch(0.135 0.025 248)",
                    }}
                  >
                    {loading && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {loading ? "Wird erstellt…" : "Konto erstellen"}
                  </Button>
                </form>
              )}

              {/* Login form */}
              {mode === "login" && (
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
                    {loading && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {loading ? "Wird angemeldet…" : "Anmelden"}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
