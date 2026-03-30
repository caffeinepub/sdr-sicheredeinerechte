import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { getSession } from "../utils/auth";

const fragenList = [
  "Mit einer Paraphe versehen wurde?",
  "Mit \u201eIm Auftrag\u201c und der Unterschrift einer Person versehen wurde, ohne den Auftraggeber (Verantwortlichen) namentlich zu benennen und ohne den vollst\u00e4ndigen Namen der unterzeichnenden Person (mit Vor- und Nachnamen) zu erkennen?",
  "Mit einem Amts-, Beh\u00f6rden- oder Gerichtsstempel versehen wurde?",
  "Den Hinweis \u201eDieses Schreiben ist maschinell erstellt und ohne Unterschrift g\u00fcltig\u201c enth\u00e4lt?",
  "Den Hinweis \u201eDieses Schreiben wurde maschinell erstellt. Es ist auch ohne Namenswiedergabe und Unterschrift g\u00fcltig\u201c enth\u00e4lt?",
  "Den Hinweis \u201eDieses Schreiben wurde maschinell erstellt und ist daher nicht unterschrieben\u201c enth\u00e4lt?",
  "Den Hinweis \u201eDieses Schreiben wurde maschinell erstellt und ist daher ohne Unterschrift g\u00fcltig\u201c enth\u00e4lt?",
  "Mit einer oder mehreren \u201eFour Corners Rule\u201c (Vier-Ecken-Regel) versehen wurde?",
  "In einem Fensterbriefumschlag ohne Briefmarke (Wertmarke) zugestellt wurde?",
];

export default function FragenPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      navigate({ to: "/" });
    }
  }, [navigate]);

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
            onClick={() => navigate({ to: "/welcome" })}
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
            data-ocid="fragen.back.button"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="rounded-2xl p-8 sm:p-12"
            style={{
              background: "oklch(0.17 0.03 248)",
              border: "1px solid oklch(0.27 0.055 248)",
            }}
            data-ocid="fragen.panel"
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

            <div
              className="space-y-6 mb-10"
              style={{ color: "oklch(0.85 0.02 235)" }}
            >
              <p className="text-lg sm:text-xl leading-relaxed">
                Haben Sie sich schon einmal gefragt, wie beispielsweise
                sogenannte behördliche Schreiben oder Forderungen von
                Institutionen der sogenannten &bdquo;Bundesrepublik
                Deutschland&ldquo; rechtsverbindlich sein können?
              </p>
              <p className="text-lg sm:text-xl leading-relaxed">
                Können behördliche oder amtliche (hoheitliche) Schreiben und
                Forderungen überhaupt ohne die Unterschrift einer hoheitlich
                befugten Person in Verbindung mit einem Amts-, Behörden- oder
                Gerichtssiegel rechtsverbindlich sein?
              </p>
              <p
                className="text-lg sm:text-xl leading-relaxed font-semibold"
                style={{ color: "oklch(0.96 0.015 230)" }}
              >
                Ist ein behördliches oder amtliches (hoheitliches) Schreiben
                rechtsverbindlich, wenn es:
              </p>
              <ol className="space-y-4 list-none" data-ocid="fragen.list">
                {fragenList.map((item, i) => (
                  <motion.li
                    key={item.slice(0, 20)}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                    className="flex gap-4 text-lg sm:text-xl leading-relaxed"
                    data-ocid={`fragen.item.${i + 1}`}
                  >
                    <span
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-0.5"
                      style={{
                        background: "oklch(0.72 0.13 218 / 0.15)",
                        border: "1px solid oklch(0.72 0.13 218 / 0.3)",
                        color: "oklch(0.72 0.13 218)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ol>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="rounded-xl px-8 py-6 text-center"
              style={{
                background: "oklch(0.72 0.13 218 / 0.1)",
                border: "2px solid oklch(0.72 0.13 218 / 0.4)",
              }}
              data-ocid="fragen.conclusion.panel"
            >
              <p
                className="text-3xl sm:text-4xl font-display font-bold"
                style={{ color: "oklch(0.72 0.13 218)" }}
              >
                Die Antwort lautet NEIN!
              </p>
            </motion.div>
          </div>
        </motion.div>
      </main>

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
