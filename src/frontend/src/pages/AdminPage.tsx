import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Shield, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { backend } from "../backendActor";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [visitorCount, setVisitorCount] = useState<bigint | null>(null);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");
    setVisitorCount(null);
    try {
      const result = await backend.getVisitorCount(password);
      if (result.__kind__ === "error") {
        setError("Ungültiges Passwort.");
      } else {
        setVisitorCount(result.ok);
      }
    } catch {
      setError("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "oklch(0.135 0.025 248)" }}
    >
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
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
              <p
                className="font-display font-bold text-base"
                style={{ color: "oklch(0.96 0.015 230)" }}
              >
                SDR Admin
              </p>
              <p className="text-sm" style={{ color: "oklch(0.73 0.03 235)" }}>
                Verwaltungsbereich
              </p>
            </div>
          </div>

          {/* Login card */}
          <div
            className="p-8 rounded-2xl"
            style={{
              background: "oklch(0.17 0.03 248)",
              border: "1px solid oklch(0.27 0.055 248)",
            }}
            data-ocid="admin.panel"
          >
            <h1
              className="font-display font-bold text-xl mb-1"
              style={{ color: "oklch(0.96 0.015 230)" }}
            >
              Admin-Zugang
            </h1>
            <p
              className="text-base mb-6"
              style={{ color: "oklch(0.73 0.03 235)" }}
            >
              Geben Sie das Admin-Passwort ein.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  className="text-base"
                  style={{ color: "oklch(0.73 0.03 235)" }}
                >
                  Admin-Passwort
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Passwort eingeben"
                    disabled={loading}
                    autoComplete="current-password"
                    className="text-base"
                    style={{
                      background: "oklch(0.13 0.03 248)",
                      border: "1px solid oklch(0.27 0.055 248)",
                      color: "oklch(0.96 0.015 230)",
                      paddingRight: "2.5rem",
                    }}
                    data-ocid="admin.password.input"
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

              {error && (
                <p
                  className="text-base py-2 px-3 rounded-lg"
                  style={{
                    color: "oklch(0.65 0.2 27)",
                    background: "oklch(0.65 0.2 27 / 0.1)",
                    border: "1px solid oklch(0.65 0.2 27 / 0.2)",
                  }}
                  data-ocid="admin.error_state"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-2.5 rounded-xl text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                style={{
                  background: "oklch(0.72 0.13 218)",
                  color: "oklch(0.135 0.025 248)",
                }}
                onMouseEnter={(e) => {
                  if (!loading && password) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "oklch(0.76 0.13 218)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "oklch(0.72 0.13 218)";
                }}
                data-ocid="admin.submit_button"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Wird geprüft…" : "Admin-Zugang"}
              </button>
            </form>

            {/* Visitor count result */}
            {visitorCount !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-6 p-6 rounded-xl text-center"
                style={{
                  background: "oklch(0.72 0.13 218 / 0.08)",
                  border: "1px solid oklch(0.72 0.13 218 / 0.25)",
                }}
                data-ocid="admin.visitor_count.card"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "oklch(0.72 0.13 218 / 0.15)" }}
                >
                  <Users
                    className="w-6 h-6"
                    style={{ color: "oklch(0.72 0.13 218)" }}
                  />
                </div>
                <p
                  className="text-sm font-medium uppercase tracking-wider mb-1"
                  style={{ color: "oklch(0.73 0.03 235)" }}
                >
                  Gesamte Besucher
                </p>
                <p
                  className="font-display font-bold text-4xl"
                  style={{ color: "oklch(0.72 0.13 218)" }}
                  data-ocid="admin.success_state"
                >
                  {visitorCount.toString()}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
