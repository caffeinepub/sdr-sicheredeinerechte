import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, FileCheck, Lock, Scale, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { backend } from "../backendActor";
import { getSession } from "../utils/auth";

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    if (session) {
      navigate({ to: "/app" });
      return;
    }
    backend.incrementVisitorCount().catch(() => null);
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
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
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

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate({ to: "/auth", search: { tab: "login" } })
              }
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-base font-medium transition-all"
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
              data-ocid="nav.login.button"
            >
              Anmelden
            </button>
            <button
              type="button"
              onClick={() =>
                navigate({ to: "/auth", search: { tab: "register" } })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-base font-semibold transition-all"
              style={{
                background: "oklch(0.72 0.13 218)",
                color: "oklch(0.135 0.025 248)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "oklch(0.76 0.13 218)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "oklch(0.72 0.13 218)";
              }}
              data-ocid="nav.register.button"
            >
              Jetzt registrieren
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section
          className="relative pt-24 pb-20 px-6 overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse 90% 60% at 50% 0%, oklch(0.72 0.13 218 / 0.1) 0%, transparent 65%)",
          }}
        >
          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.72 0.13 218) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.13 218) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />

          <div className="relative max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wider mb-8"
                style={{
                  background: "oklch(0.72 0.13 218 / 0.12)",
                  border: "1px solid oklch(0.72 0.13 218 / 0.3)",
                  color: "oklch(0.72 0.13 218)",
                }}
              >
                <Shield className="w-3.5 h-3.5" />
                Dezentral · Sicher · Transparent
              </div>

              <h1
                className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6"
                style={{ color: "oklch(0.96 0.015 230)" }}
              >
                SDR –{" "}
                <span style={{ color: "oklch(0.72 0.13 218)" }}>
                  SichereDeineRechte
                </span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="max-w-3xl mx-auto space-y-5 text-left"
              style={{ color: "oklch(0.85 0.02 235)" }}
            >
              <p className="text-lg sm:text-xl leading-relaxed">
                Fühlen Sie sich von Forderungen sogenannter Behörden oder Ämter
                unter Druck gesetzt? Fragen Sie sich, ob diese Ansprüche
                überhaupt rechtmäßig sind? Reagieren Sie noch – oder agieren Sie
                schon bewusst und informiert? Ist Ihnen klar, dass Sie durch
                gezieltes Agieren die Verantwortlichen hinter solchen
                Forderungen in die Haftung nehmen können? Möchten Sie wissen,
                wie Sie eine Zahlung leisten können, ohne dabei Ihre Rechte
                aufzugeben? Suchen Sie nach einer Möglichkeit, unter Vorbehalt
                zu handeln, ohne sich unwissentlich zu verpflichten? Und stellen
                Sie sich die entscheidende Frage: Gibt es einen sicheren Weg,
                mit solchen Forderungen umzugehen, ohne Nachteile zu riskieren?
              </p>

              <p className="text-lg sm:text-xl leading-relaxed">
                Stehen Sie vor genau diesen Fragen und suchen nach klaren,
                verständlichen Antworten? Möchten Sie nicht länger im Ungewissen
                bleiben, sondern Ihre Situation souverän einschätzen können?
                Fragen Sie sich, wie Sie strukturiert und rechtssicher mit
                solchen Forderungen umgehen können?
              </p>

              <p
                className="text-xl sm:text-2xl font-display font-bold py-2"
                style={{ color: "oklch(0.72 0.13 218)" }}
              >
                Genau hier setzt SDR (SichereDeineRechte) an.
              </p>

              <p className="text-lg sm:text-xl leading-relaxed">
                SDR unterstützt Sie dabei, komplexe Sachverhalte rund um
                sogenannte behördliche Forderungen verständlich aufzubereiten
                und zeigt Ihnen professionelle Wege auf, wie Sie informiert und
                überlegt handeln können. Statt Unsicherheit erhalten Sie
                Orientierung – statt bloßer Reaktion eine klare Strategie.
              </p>

              <p className="text-lg sm:text-xl leading-relaxed">
                Sind Sie bereit, Ihre nächsten Schritte nicht dem Zufall zu
                überlassen, sondern auf fundiertes Wissen und durchdachte
                Vorgehensweisen zu setzen?
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                type="button"
                onClick={() =>
                  navigate({ to: "/auth", search: { tab: "register" } })
                }
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-all"
                style={{
                  background: "oklch(0.72 0.13 218)",
                  color: "oklch(0.135 0.025 248)",
                  boxShadow:
                    "0 0 24px oklch(0.72 0.13 218 / 0.35), 0 4px 12px oklch(0.135 0.025 248 / 0.4)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "oklch(0.76 0.13 218)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 32px oklch(0.72 0.13 218 / 0.5), 0 4px 16px oklch(0.135 0.025 248 / 0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "oklch(0.72 0.13 218)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 24px oklch(0.72 0.13 218 / 0.35), 0 4px 12px oklch(0.135 0.025 248 / 0.4)";
                }}
                data-ocid="hero.register.primary_button"
              >
                <Shield className="w-5 h-5" />
                Jetzt registrieren
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate({ to: "/auth", search: { tab: "login" } })
                }
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all"
                style={{
                  color: "oklch(0.73 0.03 235)",
                  border: "1px solid oklch(0.27 0.055 248)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "oklch(0.96 0.015 230)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "oklch(0.72 0.13 218 / 0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "oklch(0.73 0.03 235)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "oklch(0.27 0.055 248)";
                }}
                data-ocid="hero.login.secondary_button"
              >
                Bereits registriert? Anmelden
              </button>
            </motion.div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                {
                  icon: Scale,
                  title: "Rechtssicherheit",
                  desc: "Verstehen Sie Ihre Rechte und handeln Sie auf fundierter Basis.",
                },
                {
                  icon: FileCheck,
                  title: "Strukturiert vorgehen",
                  desc: "Klare Strategien statt blindem Reagieren auf Behördenforderungen.",
                },
                {
                  icon: Lock,
                  title: "Dezentral & sicher",
                  desc: "Ihre Daten auf dem Internet Computer – zensurresistent und transparent.",
                },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  className="p-6 rounded-2xl"
                  style={{
                    background: "oklch(0.17 0.03 248)",
                    border: "1px solid oklch(0.27 0.055 248)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{
                      background: "oklch(0.72 0.13 218 / 0.12)",
                      border: "1px solid oklch(0.72 0.13 218 / 0.25)",
                    }}
                  >
                    <f.icon
                      className="w-5 h-5"
                      style={{ color: "oklch(0.72 0.13 218)" }}
                    />
                  </div>
                  <h3
                    className="font-display font-bold text-lg mb-2"
                    style={{ color: "oklch(0.96 0.015 230)" }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="text-base leading-relaxed"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="py-10 px-6"
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
            © {new Date().getFullYear()} SichereDeineRechte. Auf dem Internet
            Computer.
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
