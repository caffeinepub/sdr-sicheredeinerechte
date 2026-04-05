import { HttpAgent } from "@icp-sdk/core/agent";
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
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";
import { clearSession, getSession } from "../utils/auth";

const PDF_BLOCKS = [
  { id: "zurueckweisung", title: "Zurückweisung" },
  { id: "bedingte_annahme", title: "Bedingte Annahme" },
  { id: "annahme_unter_vorbehalt", title: "Annahme unter Vorbehalt" },
  {
    id: "annahme_unter_vorbehalt_gegenangebot",
    title: "Annahme unter Vorbehalt inkl. Gegenangebot",
  },
];

async function getPdfUrl(hash: string): Promise<string> {
  const config = await loadConfig();
  const agent = new HttpAgent({ host: config.backend_host });
  if (config.backend_host?.includes("localhost")) {
    await agent.fetchRootKey().catch(() => {});
  }
  const storageClient = new StorageClient(
    config.bucket_name,
    config.storage_gateway_url,
    config.backend_canister_id,
    config.project_id,
    agent,
  );
  return storageClient.getDirectURL(hash);
}

async function getPdfBlobUrl(hash: string): Promise<string> {
  const directUrl = await getPdfUrl(hash);
  const response = await fetch(directUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const blob = await response.blob();
  // Force PDF MIME type so browsers open in PDF viewer
  const pdfBlob = new Blob([blob], { type: "application/pdf" });
  return URL.createObjectURL(pdfBlob);
}

interface PdfViewerModalProps {
  entry: PdfEntry | null;
  onClose: () => void;
}

function PdfViewerModal({ entry, onClose }: PdfViewerModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl: string | null = null;
    if (!entry) {
      setPdfUrl(null);
      return;
    }
    setLoading(true);
    setError("");
    getPdfBlobUrl(entry.hash)
      .then((url) => {
        objectUrl = url;
        setPdfUrl(url);
      })
      .catch(() => {
        setError("PDF konnte nicht geladen werden.");
      })
      .finally(() => setLoading(false));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [entry]);

  if (!entry) return null;

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
      data-ocid="musterschreiben.pdf_viewer.modal"
    >
      <div
        className="w-full max-w-4xl max-h-screen flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: "oklch(0.135 0.025 248)",
          border: "1px solid oklch(0.27 0.055 248)",
          maxHeight: "90vh",
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
            data-ocid="musterschreiben.pdf_viewer.close_button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PDF iframe */}
        <div className="flex-1 overflow-hidden" style={{ minHeight: "400px" }}>
          {loading ? (
            <div
              className="flex items-center justify-center h-full"
              data-ocid="musterschreiben.pdf_viewer.loading_state"
            >
              <Loader2
                className="w-8 h-8 animate-spin"
                style={{ color: "oklch(0.72 0.13 218)" }}
              />
            </div>
          ) : error ? (
            <div
              className="flex items-center justify-center h-full p-6"
              data-ocid="musterschreiben.pdf_viewer.error_state"
            >
              <p style={{ color: "oklch(0.65 0.2 27)" }}>{error}</p>
            </div>
          ) : pdfUrl ? (
            <object
              data={pdfUrl}
              type="application/pdf"
              className="w-full h-full"
              style={{ minHeight: "500px", border: "none" }}
            >
              <iframe
                src={pdfUrl}
                title={entry.filename}
                className="w-full h-full"
                style={{ minHeight: "500px", border: "none" }}
              />
            </object>
          ) : null}
        </div>

        {/* Notice: changes not saved */}
        <div
          className="px-6 py-3 flex-shrink-0 text-center"
          style={{
            borderTop: "1px solid oklch(0.27 0.055 248)",
            background: "oklch(0.17 0.03 248)",
          }}
        >
          <p className="text-xs" style={{ color: "oklch(0.55 0.02 235)" }}>
            Hinweis: Änderungen werden nicht gespeichert. Nach dem Abmelden oder
            Neuladen erscheint das Dokument wieder im Ursprungszustand.
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
                    <PdfEntryRow
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

interface PdfEntryRowProps {
  entry: PdfEntry;
  rowIndex: number;
  blockIndex: number;
  onView: (entry: PdfEntry) => void;
}

function PdfEntryRow({
  entry,
  rowIndex,
  blockIndex,
  onView,
}: PdfEntryRowProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = await getPdfUrl(entry.hash);
      // Fetch the blob to trigger a real download with filename
      const resp = await fetch(url);
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = entry.filename;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
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

  // Per-block PDF entries (we load all and filter client-side)
  const [allEntries, setAllEntries] = useState<PdfEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // PDF viewer
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
        // Load PDFs for all blocks in parallel
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
      {/* PDF Viewer Overlay – no React portal, simple fixed overlay */}
      {viewingEntry && (
        <PdfViewerModal
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
              ✓ Freigegeben
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
            Hier finden Sie Ihre freigeschalteten Musterschreiben. Sie können
            die PDFs einsehen, bearbeiten und herunterladen. Änderungen werden
            nicht dauerhaft gespeichert.
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
