import { useNavigate } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { backend } from "../backendActor";
import { getSession } from "../utils/auth";

export default function WelcomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      navigate({ to: "/" });
      return;
    }

    // Heartbeat for real-time visitor tracking
    const token = `${session.nickname}-${Date.now()}`;
    backend.recordHeartbeat(token).catch(() => null);
    const interval = setInterval(() => {
      backend.recordHeartbeat(token).catch(() => null);
    }, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(0.135 0.025 248)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: "oklch(0.13 0.03 248 / 0.96)",
          borderBottom: "1px solid oklch(0.27 0.055 248)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
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
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Welcome card */}
          <div
            className="rounded-2xl p-8 sm:p-12 mb-10"
            style={{
              background: "oklch(0.17 0.03 248)",
              border: "1px solid oklch(0.27 0.055 248)",
            }}
            data-ocid="welcome.panel"
          >
            <div className="flex items-center gap-4 mb-8">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "oklch(0.72 0.13 218 / 0.15)",
                  border: "1px solid oklch(0.72 0.13 218 / 0.35)",
                }}
              >
                <Shield
                  className="w-8 h-8"
                  style={{ color: "oklch(0.72 0.13 218)" }}
                />
              </div>
              <div>
                <span
                  className="font-display font-bold text-2xl block"
                  style={{ color: "oklch(0.96 0.015 230)" }}
                >
                  SDR
                </span>
                <span
                  className="text-base font-medium"
                  style={{ color: "oklch(0.73 0.03 235)" }}
                >
                  SichereDeineRechte
                </span>
              </div>
            </div>

            <h1
              className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight mb-8"
              style={{ color: "oklch(0.72 0.13 218)" }}
            >
              Herzlich willkommen bei SDR – SichereDeineRechte!
            </h1>

            <div
              className="space-y-6"
              style={{ color: "oklch(0.85 0.02 235)" }}
            >
              <p className="text-lg sm:text-xl leading-relaxed">
                Vielen Dank für Ihre Registrierung und Ihr Interesse an den
                Informationen von SDR! Hier informieren sich Menschen, die das
                bestehende System hinterfragen und nach praktischen Lösungen
                suchen, wie man selbstbestimmt mit mangelhaften sogenannten
                Behörden-, Amts- oder Gerichtsschreiben umgeht und seine Rechte
                wahrt.
              </p>
              <p className="text-lg sm:text-xl leading-relaxed">
                Auf unserer Plattform finden Sie hilfreiche Informationen,
                inspirierende Inhalte und bei Bedarf praktische Musterschreiben
                sowie administrative Prozesse, die Ihnen den Umgang mit
                sogenannten Behörden, Ämtern oder Gerichten erleichtern. Stöbern
                Sie, probieren Sie aus und nutzen Sie die Möglichkeiten, die
                Ihnen unsere Seite bietet.
              </p>
              <p className="text-lg sm:text-xl leading-relaxed">
                Wir wünschen Ihnen viel Freude und wertvolle Erfahrungen!
              </p>
              <p
                className="text-xl sm:text-2xl font-bold"
                style={{ color: "oklch(0.96 0.015 230)" }}
              >
                Ihr SDR-Team
              </p>
            </div>
          </div>

          {/* Quote above action buttons */}
          <div className="mb-8 text-center">
            <p
              className="text-lg sm:text-xl italic leading-relaxed"
              style={{ color: "oklch(0.73 0.03 235)" }}
            >
              „Wer immer nur reagiert, hat sein Leben schon aus der Hand
              gegeben.“
            </p>
            <p
              className="mt-2 text-base"
              style={{ color: "oklch(0.55 0.02 235)" }}
            >
              – Autor unbekannt
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => navigate({ to: "/haeufige-fragen" })}
              className="flex-1 py-5 px-8 rounded-xl text-lg font-bold transition-all"
              style={{
                background: "oklch(0.72 0.13 218)",
                color: "oklch(0.135 0.025 248)",
                boxShadow: "0 0 20px oklch(0.72 0.13 218 / 0.3)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "oklch(0.76 0.13 218)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 28px oklch(0.72 0.13 218 / 0.45)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "oklch(0.72 0.13 218)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 20px oklch(0.72 0.13 218 / 0.3)";
              }}
              data-ocid="welcome.haeufige_fragen.primary_button"
            >
              Häufig gestellte Fragen
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/fragen" })}
              className="flex-1 py-5 px-8 rounded-xl text-lg font-bold transition-all"
              style={{
                background: "oklch(0.72 0.13 218)",
                color: "oklch(0.135 0.025 248)",
                boxShadow: "0 0 20px oklch(0.72 0.13 218 / 0.3)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "oklch(0.76 0.13 218)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 28px oklch(0.72 0.13 218 / 0.45)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "oklch(0.72 0.13 218)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 20px oklch(0.72 0.13 218 / 0.3)";
              }}
              data-ocid="welcome.fragen.primary_button"
            >
              Fragen über Fragen
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/app" })}
              className="flex-1 py-5 px-8 rounded-xl text-lg font-bold transition-all"
              style={{
                background: "oklch(0.62 0.22 25)",
                color: "oklch(0.97 0.01 80)",
                boxShadow: "0 0 20px oklch(0.62 0.22 25 / 0.3)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "oklch(0.66 0.22 25)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 28px oklch(0.62 0.22 25 / 0.45)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "oklch(0.62 0.22 25)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 20px oklch(0.62 0.22 25 / 0.3)";
              }}
              data-ocid="welcome.musterschreiben.secondary_button"
            >
              Musterschreiben / Dein persönlicher Bereich
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer
        className="py-10 px-6 mt-8"
        style={{ borderTop: "1px solid oklch(0.27 0.055 248)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield
              className="w-4 h-4"
              style={{ color: "oklch(0.72 0.13 218)" }}
            />
            <span
              className="font-display font-bold text-base"
              style={{ color: "oklch(0.96 0.015 230)" }}
            >
              SDR
            </span>
            <span
              className="text-base"
              style={{ color: "oklch(0.73 0.03 235)" }}
            >
              SichereDeineRechte
            </span>
          </div>
          <p className="text-sm" style={{ color: "oklch(0.55 0.02 235)" }}>
            © {new Date().getFullYear()} SichereDeineRechte. Alle Rechte
            vorbehalten.
          </p>
          <p className="text-sm" style={{ color: "oklch(0.55 0.02 235)" }}>
            Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "oklch(0.72 0.13 218)" }}
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
