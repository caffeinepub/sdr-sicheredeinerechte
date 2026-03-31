import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const faqItems = [
  {
    frage: "Kaufe ich hier eine Dienstleistung?",
    antwort:
      "Nein. Sie kaufen keine Dienstleistung. Es kommt kein Dienst- oder Werkvertrag zustande. Ihr Ausgleich für Vorlagen / administrative Prozesse ist ein solidarischer Kostenanteil zur Finanzierung einer kollektiven, dezentralen und zensurresistenten Infrastruktur.",
  },
  {
    frage: "Erhalte ich individuelle Rechtsberatung oder Vertretung?",
    antwort:
      "Nein. SDR - SichereDeineRechte erbringt keine individuelle Rechtsberatung, keine Einzelfallprüfung und keine anwaltliche Vertretung. Zur Verfügung gestellt werden standardisierte Vorlagen, Informationen und Abläufe, die von den Anwender eigenverantwortlich genutzt werden.",
  },
  {
    frage: "Was bekomme ich konkret für meinen Ausgleich?",
    antwort: (
      <>
        <p className="mb-3">Sie erhalten Zugang zu:</p>
        <ul className="space-y-2">
          <li>
            • standardisierten Schreiben, Vorlagen und administrative Prozesse,
          </li>
          <li>• Informationen zur koordinierten Vorgehensweise,</li>
          <li>
            • einer technischen, organisatorischen, dezentralen und
            zensurresistenten Infrastruktur.
          </li>
        </ul>
        <p className="mt-3">
          Dies stellt keine Einzelleistung, sondern eine gemeinschaftliche
          Ressource dar.
        </p>
      </>
    ),
  },
  {
    frage: "Gibt es ein Erfolgsversprechen?",
    antwort:
      "Nein. Es gibt keine Erfolgsgarantie für den Einzelfall. Ziel ist eine systemische Wirkung durch Masse gleichgelagerter Anwendung, nicht der garantierte Erfolg eines Einzelnen.",
  },
  {
    frage: "Was passiert mit meinem Ausgleich?",
    antwort: (
      <>
        <p className="mb-3">Der Ausgleich dient der Finanzierung von:</p>
        <ul className="space-y-2">
          <li>• technischer Infrastruktur,</li>
          <li>• Pflege und Weiterentwicklung der Vorlagen,</li>
          <li>• Koordination und Kommunikation,</li>
          <li>• Betrieb der dezentralen und zensurresistenten Plattform.</li>
        </ul>
      </>
    ),
  },
  {
    frage:
      "Ist SDR – SichereDeineRechte eine Rechtsanwaltskanzlei oder ein Inkassodienst?",
    antwort:
      "Nein. SDR – SichereDeineRechte ist keine Rechtsanwaltskanzlei, kein Inkassodienst und kein Rechtsdienstleister im Sinne des RDG.",
  },
  {
    frage: "Sind meine Daten sicher?",
    antwort:
      "Ja, Ihre Daten sind bei uns sicher und werden nicht an Dritte weitergeben.",
  },
];

export default function HaeufigeFragenPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

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
          >
            {/* Branding */}
            <div className="flex items-center gap-4 mb-10">
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
              className="font-display font-bold text-3xl sm:text-4xl leading-tight mb-10"
              style={{ color: "oklch(0.72 0.13 218)" }}
            >
              Häufig gestellte Fragen
            </h1>

            {/* Accordion */}
            <div className="space-y-3">
              {faqItems.map((item, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static list
                  key={i}
                  className="rounded-xl overflow-hidden"
                  style={{
                    border:
                      openIndex === i
                        ? "1px solid oklch(0.72 0.13 218 / 0.4)"
                        : "1px solid oklch(0.27 0.055 248)",
                    background: "oklch(0.135 0.025 248)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-all"
                    style={{
                      background:
                        openIndex === i
                          ? "oklch(0.72 0.13 218 / 0.08)"
                          : "transparent",
                    }}
                  >
                    <span
                      className="font-bold text-lg sm:text-xl leading-snug"
                      style={{ color: "oklch(0.96 0.015 230)" }}
                    >
                      {item.frage}
                    </span>
                    <ChevronDown
                      className="w-5 h-5 flex-shrink-0 transition-transform duration-300"
                      style={{
                        color: "oklch(0.72 0.13 218)",
                        transform:
                          openIndex === i ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>
                  {openIndex === i && (
                    <div
                      className="px-6 pb-6 text-lg leading-relaxed"
                      style={{ color: "oklch(0.85 0.02 235)" }}
                    >
                      {typeof item.antwort === "string" ? (
                        <p>{item.antwort}</p>
                      ) : (
                        item.antwort
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
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
