import {
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  LogOut,
  Shield,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { backend } from "../backendActor";
import { clearSession, getSession } from "../utils/auth";

const templates = [
  {
    id: 1,
    title: "Widerspruch gegen Behördenbescheid",
    description:
      "Dieses Musterschreiben ermöglicht es Ihnen, gegen einen behördlichen Bescheid Widerspruch einzulegen und Ihre Rechte gegenüber der Behörde geltend zu machen.",
    content:
      "Sehr geehrte Damen und Herren,\n\nhiermit erhebe ich Widerspruch gegen den Bescheid vom [DATUM], Aktenzeichen [AZ], und fordere Sie auf, diesen Bescheid einer rechtlichen Prüfung zu unterziehen. Ich weise ausdrücklich darauf hin, dass jedes hoheitliche Schreiben einer gültigen Unterschrift einer befugten Person sowie eines amtlichen Siegels bedarf, um rechtlich bindend zu sein. Es wird höflich gebeten, den Bescheid entsprechend zu korrigieren oder zurückzuziehen. Ich behalte mir alle rechtlichen Schritte vor.\n\nMit freundlichen Grüßen,\n[IHR NAME]",
  },
  {
    id: 2,
    title: "Anforderung von Amtsstempel und Unterschrift",
    description:
      "Nutzen Sie dieses Musterschreiben, um die zuständige Behörde aufzufordern, alle erforderlichen Bestandteile eines rechtsgültigen Schreibens nachzureichen.",
    content:
      "Sehr geehrte Damen und Herren,\n\nbezugnehmend auf Ihr Schreiben vom [DATUM] stelle ich fest, dass dieses weder die Unterschrift einer hoheitlich befugten Person noch ein amtlich anerkanntes Behörden- oder Gerichtssiegel enthält. Gemäß den gesetzlichen Anforderungen bitte ich Sie daher, das genannte Schreiben mit den entsprechenden Bestandteilen zu versehen und mir erneut zuzusenden. Bis zum Eingang eines vollständig rechtsgültigen Schreibens sehe ich mich nicht in der Lage, auf dieses zu reagieren.\n\nMit freundlichen Grüßen,\n[IHR NAME]",
  },
  {
    id: 3,
    title: "Auskunftsbegehren nach Datenschutz",
    description:
      "Mit diesem Musterschreiben fordern Sie von einer Behörde oder einem Unternehmen Auskunft über die zu Ihrer Person gespeicherten Daten gemäß DSGVO Art. 15.",
    content:
      "Sehr geehrte Damen und Herren,\n\ngemäß Art. 15 der Datenschutz-Grundverordnung (DSGVO) bitte ich Sie um vollständige Auskunft über die zu meiner Person gespeicherten personenbezogenen Daten. Bitte teilen Sie mir mit, welche Daten Sie über mich verarbeiten, zu welchem Zweck, an wen diese weitergegeben werden und wie lange die Speicherung erfolgt. Ich bitte um schriftliche Beantwortung innerhalb der gesetzlich vorgeschriebenen Frist von einem Monat.\n\nMit freundlichen Grüßen,\n[IHR NAME]",
  },
];

export default function MusterschreibenPage() {
  const [nickname, setNickname] = useState("");
  const [checking, setChecking] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [downloadMsg, setDownloadMsg] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      window.location.href = "/";
      return;
    }
    setNickname(session.nickname);
    backend.hasMusterschreibenAccess(session.nickname).then((hasAccess) => {
      if (!hasAccess) {
        window.location.href = "/zahlung";
      } else {
        setChecking(false);
      }
    });
  }, []);

  const handleLogout = () => {
    clearSession();
    window.location.href = "/";
  };

  const handleDownload = (title: string) => {
    setDownloadMsg(`Musterschreiben "${title}" wird vorbereitet…`);
    setTimeout(() => setDownloadMsg(""), 3000);
  };

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "oklch(0.135 0.025 248)" }}
        data-ocid="musterschreiben.loading_state"
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "oklch(0.72 0.13 218)" }}
          />
          <p className="text-lg" style={{ color: "oklch(0.73 0.03 235)" }}>
            Zugang wird geprüft…
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
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
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
                className="font-bold text-lg block"
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
          <div className="flex items-center gap-3">
            <span
              className="hidden sm:block text-base"
              style={{ color: "oklch(0.73 0.03 235)" }}
            >
              {nickname}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all"
              style={{
                color: "oklch(0.73 0.03 235)",
                border: "1px solid oklch(0.27 0.055 248)",
              }}
              data-ocid="musterschreiben.logout.button"
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                background: "oklch(0.55 0.15 145 / 0.15)",
                color: "oklch(0.55 0.15 145)",
                border: "1px solid oklch(0.55 0.15 145 / 0.3)",
              }}
            >
              ✓ Freigegeben
            </span>
          </div>
          <h1
            className="font-bold text-3xl sm:text-4xl mb-3"
            style={{ color: "oklch(0.96 0.015 230)" }}
          >
            Musterschreiben &amp; Administrative Prozesse
          </h1>
          <p
            className="text-lg leading-relaxed mb-10"
            style={{ color: "oklch(0.73 0.03 235)" }}
          >
            Hier finden Sie Ihre freigeschalteten Musterschreiben. Laden Sie
            diese herunter oder zeigen Sie den Inhalt direkt an.
          </p>

          {downloadMsg && (
            <div
              className="mb-6 p-4 rounded-xl text-base"
              style={{
                background: "oklch(0.55 0.15 145 / 0.1)",
                border: "1px solid oklch(0.55 0.15 145 / 0.25)",
                color: "oklch(0.55 0.15 145)",
              }}
              data-ocid="musterschreiben.success_state"
            >
              {downloadMsg}
            </div>
          )}

          <div className="space-y-5">
            {templates.map((tmpl, i) => (
              <motion.div
                key={tmpl.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "oklch(0.17 0.03 248)",
                  border: "1px solid oklch(0.27 0.055 248)",
                }}
                data-ocid={`musterschreiben.item.${i + 1}` as string}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: "oklch(0.72 0.13 218 / 0.12)",
                        border: "1px solid oklch(0.72 0.13 218 / 0.25)",
                      }}
                    >
                      <FileText
                        className="w-5 h-5"
                        style={{ color: "oklch(0.72 0.13 218)" }}
                      />
                    </div>
                    <div className="flex-1">
                      <h2
                        className="font-bold text-xl mb-1.5"
                        style={{ color: "oklch(0.96 0.015 230)" }}
                      >
                        {tmpl.title}
                      </h2>
                      <p
                        className="text-base leading-relaxed mb-4"
                        style={{ color: "oklch(0.73 0.03 235)" }}
                      >
                        {tmpl.description}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleDownload(tmpl.title)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all"
                          style={{
                            background: "oklch(0.72 0.13 218 / 0.12)",
                            color: "oklch(0.72 0.13 218)",
                            border: "1px solid oklch(0.72 0.13 218 / 0.25)",
                          }}
                          data-ocid={
                            `musterschreiben.download_button.${i + 1}` as string
                          }
                        >
                          <Download className="w-4 h-4" />
                          Herunterladen
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(
                              expandedId === tmpl.id ? null : tmpl.id,
                            )
                          }
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all"
                          style={{
                            background: "oklch(0.27 0.055 248 / 0.4)",
                            color: "oklch(0.82 0.04 230)",
                            border: "1px solid oklch(0.27 0.055 248)",
                          }}
                          data-ocid={
                            `musterschreiben.toggle.${i + 1}` as string
                          }
                        >
                          {expandedId === tmpl.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          {expandedId === tmpl.id ? "Ausblenden" : "Anzeigen"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {expandedId === tmpl.id && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ borderTop: "1px solid oklch(0.27 0.055 248)" }}
                    >
                      <div className="p-6">
                        <pre
                          className="text-base leading-relaxed whitespace-pre-wrap font-mono"
                          style={{
                            color: "oklch(0.82 0.04 230)",
                            background: "oklch(0.13 0.025 248)",
                            padding: "1.25rem",
                            borderRadius: "0.75rem",
                            border: "1px solid oklch(0.27 0.055 248)",
                          }}
                        >
                          {tmpl.content}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <p
            className="mt-10 text-base text-center"
            style={{ color: "oklch(0.55 0.02 235)" }}
          >
            Weitere Musterschreiben werden laufend hinzugefügt.
          </p>
        </motion.div>
      </main>

      <footer
        className="py-8 px-6 mt-12"
        style={{ borderTop: "1px solid oklch(0.27 0.055 248)" }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm" style={{ color: "oklch(0.55 0.02 235)" }}>
            © {new Date().getFullYear()} SichereDeineRechte. Built with love
            using{" "}
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
