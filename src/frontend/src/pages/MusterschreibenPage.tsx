import {
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileText,
  Loader2,
  LogOut,
  Shield,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { PdfEntry } from "../backend.d";
import { backend } from "../backendActor";
import { clearSession, getSession } from "../utils/auth";

const PDF_BLOCKS = [
  { id: "zurueckweisung", title: "Zur\u00fcckweisung" },
  { id: "bedingte_annahme", title: "Bedingte Annahme" },
  { id: "annahme_unter_vorbehalt", title: "Annahme unter Vorbehalt" },
  {
    id: "annahme_unter_vorbehalt_gegenangebot",
    title: "Annahme unter Vorbehalt inkl. Gegenangebot",
  },
];

const ODT_MIME = "application/vnd.oasis.opendocument.text";

// Convert base64 string to a blob URL for ODT download
function base64ToBlobUrl(base64Data: string): string {
  const byteChars = atob(base64Data);
  const byteNumbers = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const blob = new Blob([byteNumbers], { type: ODT_MIME });
  return URL.createObjectURL(blob);
}

interface OdtViewerModalProps {
  entry: PdfEntry | null;
  onClose: () => void;
}

function OdtViewerModal({ entry, onClose }: OdtViewerModalProps) {
  if (!entry) return null;

  const handleDownload = () => {
    const url = base64ToBlobUrl(entry.base64Data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = entry.filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "oklch(0.05 0.015 248 / 0.9)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      data-ocid="musterschreiben.odt_viewer.modal"
    >
      <div
        className="w-full max-w-lg flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: "oklch(0.135 0.025 248)",
          border: "1px solid oklch(0.27 0.055 248)",
        }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid oklch(0.27 0.055 248)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText
              className="w-5 h-5 flex-shrink-0"
              style={{ color: "oklch(0.72 0.13 218)" }}
            />
            <span
              className="font-semibold text-base truncate"
              style={{ color: "oklch(0.96 0.015 230)" }}
            >
              {entry.filename}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition-all ml-3"
            style={{
              color: "oklch(0.73 0.03 235)",
              border: "1px solid oklch(0.27 0.055 248)",
            }}
            data-ocid="musterschreiben.odt_viewer.close_button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info area */}
        <div className="px-6 py-6 flex flex-col gap-4">
          <p className="text-base" style={{ color: "oklch(0.82 0.04 230)" }}>
            ODT-Dateien können nicht direkt im Browser angezeigt werden. Laden
            Sie die Datei herunter und öffnen Sie sie mit LibreOffice,
            OpenOffice oder Microsoft Word.
          </p>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-base font-semibold transition-all"
            style={{
              background: "oklch(0.55 0.15 145 / 0.15)",
              color: "oklch(0.55 0.15 145)",
              border: "1px solid oklch(0.55 0.15 145 / 0.3)",
            }}
            data-ocid="musterschreiben.odt_viewer.download_button"
          >
            <Download className="w-5 h-5" />
            Herunterladen
          </button>
        </div>

        {/* Notice */}
        <div
          className="px-6 py-3 flex-shrink-0 text-center"
          style={{
            borderTop: "1px solid oklch(0.27 0.055 248)",
            background: "oklch(0.17 0.03 248)",
          }}
        >
          <p className="text-xs" style={{ color: "oklch(0.55 0.02 235)" }}>
            Hinweis: Änderungen in der heruntergeladenen Datei werden nicht
            dauerhaft gespeichert.
          </p>
        </div>
      </div>
    </div>
  );
}

interface PdfBlockSectionProps {
  block: { id: string; title: string };
  entries: PdfEntry[];
  loading: boolean;
  onView: (entry: PdfEntry) => void;
  blockIndex: number;
}

function PdfBlockSection({
  block,
  entries,
  loading,
  onView,
  blockIndex,
}: PdfBlockSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const blockEntries = entries.filter((e) => e.blockId === block.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: blockIndex * 0.1 }}
      className="rounded-2xl overflow-hidden w-full"
      style={{
        background: "oklch(0.17 0.03 248)",
        border: "1px solid oklch(0.27 0.055 248)",
      }}
      data-ocid={`musterschreiben.block.${blockIndex + 1}.panel`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-6 py-5 transition-all"
        style={{
          background: "oklch(0.17 0.03 248)",
          color: "oklch(0.96 0.015 230)",
        }}
        data-ocid={`musterschreiben.block.${blockIndex + 1}.toggle`}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "oklch(0.72 0.13 218 / 0.12)",
              border: "1px solid oklch(0.72 0.13 218 / 0.25)",
            }}
          >
            <FileText
              className="w-4 h-4"
              style={{ color: "oklch(0.72 0.13 218)" }}
            />
          </div>
          <span className="font-bold text-xl">{block.title}</span>
          {!loading && (
            <span
              className="text-sm px-2.5 py-0.5 rounded-full"
              style={{
                background: "oklch(0.72 0.13 218 / 0.12)",
                color: "oklch(0.72 0.13 218)",
                border: "1px solid oklch(0.72 0.13 218 / 0.25)",
              }}
            >
              {blockEntries.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp
            className="w-5 h-5 flex-shrink-0"
            style={{ color: "oklch(0.72 0.13 218)" }}
          />
        ) : (
          <ChevronDown
            className="w-5 h-5 flex-shrink-0"
            style={{ color: "oklch(0.72 0.13 218)" }}
          />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ borderTop: "1px solid oklch(0.27 0.055 248)" }}
          >
            <div className="px-6 py-5">
              {loading ? (
                <div
                  className="flex items-center justify-center py-6"
                  data-ocid={`musterschreiben.block.${blockIndex + 1}.loading_state`}
                >
                  <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "oklch(0.72 0.13 218)" }}
                  />
                </div>
              ) : blockEntries.length === 0 ? (
                <p
                  className="text-base"
                  style={{ color: "oklch(0.55 0.02 235)" }}
                  data-ocid={`musterschreiben.block.${blockIndex + 1}.empty_state`}
                >
                  Keine Dokumente vorhanden.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {blockEntries.map((entry, idx) => (
                    <OdtEntryRow
                      key={entry.id}
                      entry={entry}
                      rowIndex={idx}
                      blockIndex={blockIndex}
                      onView={onView}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface OdtEntryRowProps {
  entry: PdfEntry;
  rowIndex: number;
  blockIndex: number;
  onView: (entry: PdfEntry) => void;
}

function OdtEntryRow({
  entry,
  rowIndex,
  blockIndex,
  onView,
}: OdtEntryRowProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    try {
      const url = base64ToBlobUrl(entry.base64Data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = entry.filename;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      // silently fail
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-between gap-4 p-4 rounded-xl"
      style={{
        background: "oklch(0.13 0.025 248)",
        border: "1px solid oklch(0.27 0.055 248)",
      }}
      data-ocid={`musterschreiben.block.${blockIndex + 1}.item.${rowIndex + 1}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: "oklch(0.72 0.13 218 / 0.12)",
            border: "1px solid oklch(0.72 0.13 218 / 0.25)",
          }}
        >
          <FileText
            className="w-4 h-4"
            style={{ color: "oklch(0.72 0.13 218)" }}
          />
        </div>
        <span
          className="text-base font-medium truncate"
          style={{ color: "oklch(0.82 0.04 230)" }}
          title={entry.filename}
        >
          {entry.filename}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onView(entry)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: "oklch(0.72 0.13 218 / 0.12)",
            color: "oklch(0.72 0.13 218)",
            border: "1px solid oklch(0.72 0.13 218 / 0.25)",
          }}
          data-ocid={`musterschreiben.block.${blockIndex + 1}.view_button.${rowIndex + 1}`}
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Anzeigen</span>
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60"
          style={{
            background: "oklch(0.55 0.15 145 / 0.12)",
            color: "oklch(0.55 0.15 145)",
            border: "1px solid oklch(0.55 0.15 145 / 0.25)",
          }}
          data-ocid={`musterschreiben.block.${blockIndex + 1}.download_button.${rowIndex + 1}`}
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Herunterladen</span>
        </button>
      </div>
    </div>
  );
}

export default function MusterschreibenPage() {
  const [nickname, setNickname] = useState("");
  const [checking, setChecking] = useState(true);
  const [allEntries, setAllEntries] = useState<PdfEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<PdfEntry | null>(null);

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
        setLoadingEntries(true);
        Promise.all(
          PDF_BLOCKS.map((block) =>
            backend
              .getPdfEntriesByBlock(block.id)
              .catch(() => [] as PdfEntry[]),
          ),
        )
          .then((results) => {
            setAllEntries(results.flat());
          })
          .finally(() => setLoadingEntries(false));
      }
    });
  }, []);

  const handleLogout = () => {
    clearSession();
    window.location.href = "/";
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
            Zugang wird gepr\u00fcft\u2026
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
      {/* ODT Viewer Overlay */}
      {viewingEntry && (
        <OdtViewerModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
        />
      )}

      <header
        className="sticky top-0 z-40 w-full"
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
              \u2713 Freigegeben
            </span>
          </div>
          <h1
            className="font-bold text-3xl sm:text-4xl mb-3"
            style={{ color: "oklch(0.96 0.015 230)" }}
          >
            Musterschreiben
          </h1>
          <p
            className="text-lg leading-relaxed mb-10"
            style={{ color: "oklch(0.73 0.03 235)" }}
          >
            Hier finden Sie Ihre freigeschalteten Musterschreiben. Sie
            k\u00f6nnen die ODT-Dateien herunterladen und mit LibreOffice,
            OpenOffice oder Microsoft Word bearbeiten.
          </p>

          <div className="flex flex-col gap-6">
            {PDF_BLOCKS.map((block, idx) => (
              <PdfBlockSection
                key={block.id}
                block={block}
                entries={allEntries}
                loading={loadingEntries}
                onView={setViewingEntry}
                blockIndex={idx}
              />
            ))}
          </div>

          <p
            className="mt-10 text-base text-center"
            style={{ color: "oklch(0.55 0.02 235)" }}
          >
            Weitere Musterschreiben werden laufend hinzugef\u00fcgt.
          </p>
        </motion.div>
      </main>

      <footer
        className="py-8 px-6 mt-12"
        style={{ borderTop: "1px solid oklch(0.27 0.055 248)" }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm" style={{ color: "oklch(0.55 0.02 235)" }}>
            \u00a9 {new Date().getFullYear()} SichereDeineRechte. Built with
            love using{" "}
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
