import { useNavigate } from "@tanstack/react-router";
import { BookOpen, LogOut, Scale, Shield, Users } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { clearSession, getSession } from "../utils/auth";

export default function Dashboard() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      navigate({ to: "/" });
      return;
    }
    setNickname(session.nickname);
    setChecking(false);
  }, [navigate]);

  const handleLogout = () => {
    clearSession();
    toast.success("Sie wurden abgemeldet.");
    navigate({ to: "/" });
  };

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "oklch(0.135 0.025 248)" }}
        data-ocid="dashboard.loading_state"
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ background: "oklch(0.72 0.13 218 / 0.2)" }}
          >
            <Shield
              className="w-6 h-6"
              style={{ color: "oklch(0.72 0.13 218)" }}
            />
          </div>
          <p className="text-base" style={{ color: "oklch(0.73 0.03 235)" }}>
            Wird geladen…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(0.135 0.025 248)" }}
    >
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: "oklch(0.13 0.03 248 / 0.96)",
          borderBottom: "1px solid oklch(0.27 0.055 248)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
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
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all"
            style={{
              color: "oklch(0.73 0.03 235)",
              border: "1px solid oklch(0.27 0.055 248)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "oklch(0.96 0.015 230)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "oklch(0.72 0.13 218 / 0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "oklch(0.73 0.03 235)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "oklch(0.27 0.055 248)";
            }}
            data-ocid="dashboard.logout.button"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1
            className="font-display font-bold text-3xl sm:text-4xl mb-2"
            style={{ color: "oklch(0.96 0.015 230)" }}
          >
            Willkommen,{" "}
            <span style={{ color: "oklch(0.72 0.13 218)" }}>{nickname}</span>!
          </h1>
          <p className="text-base" style={{ color: "oklch(0.73 0.03 235)" }}>
            Ihr persönlicher Bereich bei SichereDeineRechte.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-8 rounded-2xl mb-6"
          style={{
            background: "oklch(0.17 0.03 248)",
            border: "1px solid oklch(0.27 0.055 248)",
          }}
          data-ocid="dashboard.panel"
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "oklch(0.72 0.13 218 / 0.12)",
                border: "1px solid oklch(0.72 0.13 218 / 0.25)",
              }}
            >
              <Shield
                className="w-6 h-6"
                style={{ color: "oklch(0.72 0.13 218)" }}
              />
            </div>
            <div>
              <h2
                className="font-display font-bold text-xl mb-2"
                style={{ color: "oklch(0.96 0.015 230)" }}
              >
                Ihr persönlicher Bereich
              </h2>
              <p
                className="text-base leading-relaxed"
                style={{ color: "oklch(0.73 0.03 235)" }}
              >
                Weitere Funktionen folgen bald. Hier werden Sie Ihre Dokumente,
                Strategien und rechtlichen Leitfäden verwalten können.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: BookOpen,
              title: "Wissensbasis",
              desc: "Rechtliche Grundlagen und Strategien. Demnächst verfügbar.",
            },
            {
              icon: Scale,
              title: "Fallanalyse",
              desc: "Analysieren Sie Ihre spezifische Situation. Demnächst verfügbar.",
            },
            {
              icon: Users,
              title: "Community",
              desc: "Erfahrungsaustausch mit anderen Nutzern. Demnächst verfügbar.",
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
              className="p-6 rounded-2xl"
              style={{
                background: "oklch(0.17 0.03 248 / 0.5)",
                border: "1px solid oklch(0.27 0.055 248 / 0.6)",
              }}
              data-ocid={`dashboard.feature.card.${i + 1}` as string}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 opacity-60"
                style={{
                  background: "oklch(0.72 0.13 218 / 0.08)",
                  border: "1px solid oklch(0.72 0.13 218 / 0.15)",
                }}
              >
                <card.icon
                  className="w-4 h-4"
                  style={{ color: "oklch(0.72 0.13 218)" }}
                />
              </div>
              <h3
                className="font-display font-semibold text-base mb-1"
                style={{ color: "oklch(0.73 0.03 235)" }}
              >
                {card.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "oklch(0.55 0.02 235)" }}
              >
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer
        className="py-8 px-6 mt-12"
        style={{ borderTop: "1px solid oklch(0.27 0.055 248)" }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm" style={{ color: "oklch(0.55 0.02 235)" }}>
            © {new Date().getFullYear()} SichereDeineRechte. Auf dem Internet
            Computer. Built with love using{" "}
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
