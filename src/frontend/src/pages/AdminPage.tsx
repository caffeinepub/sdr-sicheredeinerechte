import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Loader2,
  LogOut,
  Search,
  Shield,
  Trash2,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { PaymentRequest, PdfEntry, TxCheckResult } from "../backend.d";
import { backend } from "../backendActor";

const ADMIN_PASSWORD = "WotanClan44!";

const PDF_BLOCKS = [
  { id: "zurueckweisung", title: "Zurückweisung" },
  { id: "bedingte_annahme", title: "Bedingte Annahme" },
  { id: "annahme_unter_vorbehalt", title: "Annahme unter Vorbehalt" },
  {
    id: "annahme_unter_vorbehalt_gegenangebot",
    title: "Annahme unter Vorbehalt inkl. Gegenangebot",
  },
];

// Convert a File to a base64 string (no data URL prefix)
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:application/vnd.oasis.opendocument.text;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () =>
      reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<
    string,
    { label: string; color: string; bg: string; border: string }
  > = {
    confirmed: {
      label: "Bestätigt",
      color: "oklch(0.55 0.15 145)",
      bg: "oklch(0.55 0.15 145 / 0.12)",
      border: "1px solid oklch(0.55 0.15 145 / 0.3)",
    },
    rejected: {
      label: "Abgelehnt",
      color: "oklch(0.62 0.22 25)",
      bg: "oklch(0.62 0.22 25 / 0.12)",
      border: "1px solid oklch(0.62 0.22 25 / 0.3)",
    },
    pending: {
      label: "Ausstehend",
      color: "oklch(0.72 0.13 218)",
      bg: "oklch(0.72 0.13 218 / 0.12)",
      border: "1px solid oklch(0.72 0.13 218 / 0.3)",
    },
  };
  const cfg = configs[status] ?? configs.pending;
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-sm font-medium"
      style={{ color: cfg.color, background: cfg.bg, border: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}

function formatTimestamp(unixSecs: string): string {
  const n = Number.parseInt(unixSecs, 10);
  if (!n || n === 0) return "Unbekannt";
  return `${new Date(n * 1000).toLocaleString("de-DE", { timeZone: "UTC" })} UTC`;
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length <= 26) return addr;
  return `${addr.slice(0, 20)}...${addr.slice(-6)}`;
}

function TxResultPanel({ result }: { result: TxCheckResult }) {
  const hasData = result.amount && result.amount !== "";
  const showEur = result.addressMatch && result.eurAmount !== null;

  return (
    <div
      className="mt-3 rounded-xl p-4 space-y-3"
      style={{
        background: "oklch(0.10 0.025 248)",
        border: "1px solid oklch(0.27 0.055 248)",
      }}
      data-ocid="admin.tx_check.panel"
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "oklch(0.72 0.13 218)" }}
      >
        Transaktionsdaten
      </p>

      {/* Pure error — no data at all */}
      {!hasData && result.errorMsg && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2.5"
          style={{
            background: "oklch(0.62 0.22 25 / 0.12)",
            border: "1px solid oklch(0.62 0.22 25 / 0.3)",
          }}
          data-ocid="admin.tx_check.error_state"
        >
          <XCircle
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            style={{ color: "oklch(0.65 0.22 25)" }}
          />
          <span className="text-sm" style={{ color: "oklch(0.65 0.22 25)" }}>
            {result.errorMsg}
          </span>
        </div>
      )}

      {/* Transaction data rows */}
      {hasData && (
        <dl className="space-y-1.5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <dt
              className="text-xs font-medium min-w-[130px]"
              style={{ color: "oklch(0.55 0.02 235)" }}
            >
              Betrag:
            </dt>
            <dd
              className="text-sm font-semibold"
              style={{ color: "oklch(0.96 0.015 230)" }}
            >
              {result.amount} {result.currency}
            </dd>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <dt
              className="text-xs font-medium min-w-[130px]"
              style={{ color: "oklch(0.55 0.02 235)" }}
            >
              Zeitstempel (UTC):
            </dt>
            <dd className="text-sm" style={{ color: "oklch(0.82 0.04 230)" }}>
              {formatTimestamp(result.timestamp)}
            </dd>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <dt
              className="text-xs font-medium min-w-[130px]"
              style={{ color: "oklch(0.55 0.02 235)" }}
            >
              Empfangsadresse:
            </dt>
            <dd
              className="text-sm font-mono"
              style={{ color: "oklch(0.82 0.04 230)" }}
              title={result.toAddress}
            >
              {truncateAddress(result.toAddress)}
            </dd>
          </div>
        </dl>
      )}

      {/* Address match indicator */}
      {hasData && (
        <div>
          {result.addressMatch ? (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
              style={{
                background: "oklch(0.55 0.15 145 / 0.15)",
                color: "oklch(0.55 0.15 145)",
                border: "1px solid oklch(0.55 0.15 145 / 0.3)",
              }}
              data-ocid="admin.tx_check.success_state"
            >
              <CheckCircle className="w-4 h-4" />
              Empfangsadresse bestätigt
            </div>
          ) : (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2.5"
              style={{
                background: "oklch(0.62 0.22 25 / 0.15)",
                border: "2px solid oklch(0.62 0.22 25 / 0.5)",
              }}
              data-ocid="admin.tx_check.error_state"
            >
              <AlertTriangle
                className="w-5 h-5 flex-shrink-0"
                style={{ color: "oklch(0.68 0.22 25)" }}
              />
              <span
                className="font-bold text-base"
                style={{ color: "oklch(0.68 0.22 25)" }}
              >
                Falsche Empfangsadresse!
              </span>
            </div>
          )}
        </div>
      )}

      {/* Euro amount */}
      {hasData && result.addressMatch && (
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-medium"
            style={{ color: "oklch(0.55 0.02 235)" }}
          >
            Euro-Betrag:
          </span>
          {showEur ? (
            <span className="flex items-center gap-1.5">
              <span
                className="text-sm font-bold"
                style={{ color: "oklch(0.96 0.015 230)" }}
              >
                {(result.eurAmount as number).toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                €
              </span>
              <span
                className="text-lg leading-none"
                style={{
                  color:
                    (result.eurAmount as number) > 195
                      ? "oklch(0.55 0.18 145)"
                      : "oklch(0.65 0.22 25)",
                }}
                title={
                  (result.eurAmount as number) > 195
                    ? "Über 195 €"
                    : "Unter 195 €"
                }
              >
                ●
              </span>
            </span>
          ) : (
            <span className="text-sm" style={{ color: "oklch(0.55 0.02 235)" }}>
              nicht verfügbar
              {result.errorMsg && (
                <span className="ml-2" style={{ color: "oklch(0.65 0.15 55)" }}>
                  ({result.errorMsg})
                </span>
              )}
            </span>
          )}
        </div>
      )}

      {/* Partial success note (has data but also has error) */}
      {hasData && result.errorMsg && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2"
          style={{
            background: "oklch(0.72 0.16 55 / 0.1)",
            border: "1px solid oklch(0.72 0.16 55 / 0.25)",
          }}
        >
          <AlertTriangle
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            style={{ color: "oklch(0.75 0.16 55)" }}
          />
          <span className="text-xs" style={{ color: "oklch(0.75 0.16 55)" }}>
            {result.errorMsg}
          </span>
        </div>
      )}
    </div>
  );
}

interface PdfBlockCardProps {
  blockId: string;
  title: string;
  entries: PdfEntry[];
  onUpload: (blockId: string, file: File) => Promise<void>;
  onDelete: (entryId: string) => Promise<void>;
  uploading: boolean;
  uploadProgress: number;
  uploadError: string;
  uploadSuccess: string;
}

function PdfBlockCard({
  blockId,
  title,
  entries,
  onUpload,
  onDelete,
  uploading,
  uploadProgress,
  uploadError,
  uploadSuccess,
}: PdfBlockCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return;
    await onUpload(blockId, selectedFile);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (entryId: string) => {
    setDeletingId(entryId);
    await onDelete(entryId);
    setDeletingId(null);
  };

  const blockEntries = entries.filter((e) => e.blockId === blockId);

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4"
      style={{
        background: "oklch(0.13 0.025 248)",
        border: "1px solid oklch(0.27 0.055 248)",
      }}
      data-ocid={`admin.pdf_block.${blockId}.panel`}
    >
      <h3
        className="font-bold text-base"
        style={{ color: "oklch(0.72 0.13 218)" }}
      >
        {title}
      </h3>

      {/* Upload area */}
      <div className="flex flex-col gap-3">
        <label
          htmlFor={`pdf-upload-${blockId}`}
          className="text-sm font-medium"
          style={{ color: "oklch(0.73 0.03 235)" }}
        >
          ODT-Datei hochladen (nur .odt)
        </label>
        <input
          ref={fileInputRef}
          id={`pdf-upload-${blockId}`}
          type="file"
          accept=".odt,application/vnd.oasis.opendocument.text"
          onChange={handleFileChange}
          className="block w-full text-sm rounded-lg px-3 py-2 cursor-pointer"
          style={{
            color: "oklch(0.82 0.04 230)",
            background: "oklch(0.17 0.03 248)",
            border: "1px solid oklch(0.27 0.055 248)",
          }}
          data-ocid={`admin.pdf_block.${blockId}.upload_button`}
        />
        {selectedFile && (
          <p className="text-sm" style={{ color: "oklch(0.73 0.03 235)" }}>
            Ausgewählt:{" "}
            <span style={{ color: "oklch(0.82 0.04 230)" }}>
              {selectedFile.name}
            </span>
          </p>
        )}
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={!selectedFile || uploading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all self-start disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background:
              selectedFile && !uploading
                ? "oklch(0.72 0.13 218 / 0.18)"
                : "oklch(0.27 0.055 248 / 0.5)",
            color:
              selectedFile && !uploading
                ? "oklch(0.72 0.13 218)"
                : "oklch(0.55 0.02 235)",
            border: "1px solid oklch(0.72 0.13 218 / 0.3)",
          }}
          data-ocid={`admin.pdf_block.${blockId}.submit_button`}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? `Hochladen… ${uploadProgress}%` : "ODT hochladen"}
        </button>
        {uploading && (
          <div
            className="w-full rounded-full h-2 overflow-hidden"
            style={{ background: "oklch(0.27 0.055 248)" }}
          >
            <div
              className="h-2 rounded-full transition-all duration-200"
              style={{
                width: `${uploadProgress}%`,
                background: "oklch(0.72 0.13 218)",
              }}
            />
          </div>
        )}
        {uploadError && (
          <p
            className="text-sm rounded-lg px-3 py-2"
            style={{
              color: "oklch(0.65 0.2 27)",
              background: "oklch(0.65 0.2 27 / 0.1)",
              border: "1px solid oklch(0.65 0.2 27 / 0.25)",
            }}
            data-ocid={`admin.pdf_block.${blockId}.error_state`}
          >
            {uploadError}
          </p>
        )}
        {uploadSuccess && (
          <p
            className="text-sm rounded-lg px-3 py-2"
            style={{
              color: "oklch(0.55 0.15 145)",
              background: "oklch(0.55 0.15 145 / 0.1)",
              border: "1px solid oklch(0.55 0.15 145 / 0.25)",
            }}
            data-ocid={`admin.pdf_block.${blockId}.success_state`}
          >
            {uploadSuccess}
          </p>
        )}
      </div>

      {/* ODT list */}
      <div className="flex flex-col gap-2">
        <p
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "oklch(0.55 0.02 235)" }}
        >
          Hochgeladene ODT-Dateien ({blockEntries.length})
        </p>
        {blockEntries.length === 0 ? (
          <p
            className="text-sm"
            style={{ color: "oklch(0.55 0.02 235)" }}
            data-ocid={`admin.pdf_block.${blockId}.empty_state`}
          >
            Keine ODT-Dateien hochgeladen.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {blockEntries.map((entry, idx) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg"
                style={{
                  background: "oklch(0.17 0.03 248)",
                  border: "1px solid oklch(0.27 0.055 248)",
                }}
                data-ocid={`admin.pdf_block.${blockId}.item.${idx + 1}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "oklch(0.72 0.13 218)" }}
                  />
                  <span
                    className="text-sm truncate"
                    style={{ color: "oklch(0.82 0.04 230)" }}
                    title={entry.filename}
                  >
                    {entry.filename}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all disabled:opacity-50"
                  style={{
                    background: "oklch(0.62 0.22 25 / 0.12)",
                    color: "oklch(0.62 0.22 25)",
                    border: "1px solid oklch(0.62 0.22 25 / 0.3)",
                  }}
                  title="Löschen"
                  data-ocid={`admin.pdf_block.${blockId}.delete_button.${idx + 1}`}
                >
                  {deletingId === entry.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [visitorCount, setVisitorCount] = useState<bigint | null>(null);
  const [visitorLoading, setVisitorLoading] = useState(false);
  const [activeCount, setActiveCount] = useState<bigint | null>(null);
  const [activeLoading, setActiveLoading] = useState(false);
  const [musterschreibenCount, setMusterschreibenCount] = useState<
    bigint | null
  >(null);
  const [musterschreibenLoading, setMusterschreibenLoading] = useState(false);

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const [showPayments, setShowPayments] = useState(false);
  const [copiedTx, setCopiedTx] = useState("");

  // Transaction check state
  const [txCheckResults, setTxCheckResults] = useState<
    Record<string, TxCheckResult | null>
  >({});
  const [txCheckLoading, setTxCheckLoading] = useState<Record<string, boolean>>(
    {},
  );

  // ODT management state
  const [showPdfManagement, setShowPdfManagement] = useState(false);
  const [pdfEntries, setPdfEntries] = useState<PdfEntry[]>([]);
  const [loadingPdfs, setLoadingPdfs] = useState(false);
  const [blockUploadState, setBlockUploadState] = useState<
    Record<
      string,
      { uploading: boolean; progress: number; error: string; success: string }
    >
  >({});

  const getBlockUploadState = (blockId: string) =>
    blockUploadState[blockId] ?? {
      uploading: false,
      progress: 0,
      error: "",
      success: "",
    };

  const setBlockState = (
    blockId: string,
    patch: Partial<{
      uploading: boolean;
      progress: number;
      error: string;
      success: string;
    }>,
  ) => {
    setBlockUploadState((prev) => ({
      ...prev,
      [blockId]: { ...getBlockUploadState(blockId), ...patch },
    }));
  };

  const loadActiveCount = async () => {
    setActiveLoading(true);
    try {
      const result = await backend.getActiveVisitorCount(ADMIN_PASSWORD);
      if (result.__kind__ === "ok") {
        setActiveCount(result.ok);
      }
    } catch {
      // silently fail
    } finally {
      setActiveLoading(false);
    }
  };

  const loadMusterschreibenCount = async () => {
    setMusterschreibenLoading(true);
    try {
      const result = await backend.getMusterschreibenCount(ADMIN_PASSWORD);
      if (result.__kind__ === "ok") {
        setMusterschreibenCount(result.ok);
      }
    } catch {
      // silently fail
    } finally {
      setMusterschreibenLoading(false);
    }
  };

  const loadPdfEntries = async () => {
    setLoadingPdfs(true);
    try {
      const result = await backend.getAllPdfEntries(ADMIN_PASSWORD);
      if (result.__kind__ === "ok") {
        setPdfEntries(result.ok);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingPdfs(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadActiveCount is stable
  useEffect(() => {
    const storedPw = sessionStorage.getItem("adminPw");
    if (storedPw === ADMIN_PASSWORD) {
      sessionStorage.removeItem("adminPw");
      setIsAuthenticated(true);

      setVisitorLoading(true);
      backend
        .getVisitorCount(ADMIN_PASSWORD)
        .then((result) => {
          if (result.__kind__ === "ok") {
            setVisitorCount(result.ok);
          }
        })
        .catch(() => {})
        .finally(() => setVisitorLoading(false));

      setLoadingPayments(true);
      backend
        .getAllPaymentRequests(ADMIN_PASSWORD)
        .then((result) => {
          if (result.__kind__ === "ok") {
            setPaymentRequests(result.ok);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingPayments(false));

      loadActiveCount();
      const interval = setInterval(loadActiveCount, 30000);
      loadMusterschreibenCount();

      return () => clearInterval(interval);
    }
    window.location.href = "/";
  }, []);

  const loadPaymentRequests = async () => {
    setLoadingPayments(true);
    try {
      const result = await backend.getAllPaymentRequests(ADMIN_PASSWORD);
      if (result.__kind__ === "ok") {
        setPaymentRequests(result.ok);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleApprove = async (nickname: string) => {
    setPaymentMsg("");
    setPaymentError("");
    try {
      const result = await backend.approvePayment(ADMIN_PASSWORD, nickname);
      if (result.__kind__ === "ok") {
        setPaymentMsg(`Ausgleich für "${nickname}" genehmigt.`);
        loadPaymentRequests();
        loadMusterschreibenCount();
      } else {
        setPaymentError(result.error);
      }
    } catch {
      setPaymentError("Verbindungsfehler.");
    }
  };

  const handleReject = async (nickname: string) => {
    setPaymentMsg("");
    setPaymentError("");
    try {
      const result = await backend.rejectPayment(ADMIN_PASSWORD, nickname);
      if (result.__kind__ === "ok") {
        setPaymentMsg(`Ausgleich für "${nickname}" abgelehnt.`);
        loadPaymentRequests();
      } else {
        setPaymentError(result.error);
      }
    } catch {
      setPaymentError("Verbindungsfehler.");
    }
  };

  const handleGrantAccess = async (nickname: string) => {
    setPaymentMsg("");
    setPaymentError("");
    try {
      const result = await backend.grantMusterschreibenAccess(
        ADMIN_PASSWORD,
        nickname,
      );
      if (result.__kind__ === "ok") {
        setPaymentMsg(
          `Musterschreiben-Zugang für "${nickname}" freigeschaltet.`,
        );
        loadPaymentRequests();
        loadMusterschreibenCount();
      } else {
        setPaymentError(result.error);
      }
    } catch {
      setPaymentError("Verbindungsfehler.");
    }
  };

  const handleCheckTransaction = async (
    nickname: string,
    currency: string,
    txHash: string,
  ) => {
    const key = `${nickname}-${txHash}`;
    setTxCheckLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const result = await backend.checkTransaction(
        ADMIN_PASSWORD,
        currency,
        txHash,
      );
      if (result.__kind__ === "ok") {
        setTxCheckResults((prev) => ({ ...prev, [key]: result.ok }));
      } else {
        setTxCheckResults((prev) => ({
          ...prev,
          [key]: {
            amount: "",
            currency,
            timestamp: "",
            toAddress: "",
            addressMatch: false,
            eurAmount: null,
            errorMsg: result.error,
          },
        }));
      }
    } catch {
      setTxCheckResults((prev) => ({
        ...prev,
        [key]: {
          amount: "",
          currency,
          timestamp: "",
          toAddress: "",
          addressMatch: false,
          eurAmount: null,
          errorMsg: "Verbindungsfehler beim Abrufen der Transaktionsdaten.",
        },
      }));
    } finally {
      setTxCheckLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Upload ODT: convert to base64 and store directly in the backend
  const handlePdfUpload = async (blockId: string, file: File) => {
    setBlockState(blockId, {
      uploading: true,
      progress: 10,
      error: "",
      success: "",
    });
    try {
      setBlockState(blockId, { progress: 40 });
      const base64Data = await fileToBase64(file);
      setBlockState(blockId, { progress: 70 });

      const result = await backend.addPdfEntry(
        ADMIN_PASSWORD,
        blockId,
        file.name,
        base64Data,
      );

      if (result.__kind__ === "ok") {
        setBlockState(blockId, {
          uploading: false,
          progress: 100,
          success: `"${file.name}" wurde erfolgreich hochgeladen.`,
        });
        await loadPdfEntries();
        setTimeout(
          () => setBlockState(blockId, { success: "", progress: 0 }),
          4000,
        );
      } else {
        setBlockState(blockId, {
          uploading: false,
          error: result.error ?? "Fehler beim Speichern.",
        });
      }
    } catch (err) {
      setBlockState(blockId, {
        uploading: false,
        error: `Upload fehlgeschlagen: ${
          err instanceof Error ? err.message : "Unbekannter Fehler"
        }`,
      });
    }
  };

  const handlePdfDelete = async (entryId: string) => {
    try {
      const result = await backend.deletePdfEntry(ADMIN_PASSWORD, entryId);
      if (result.__kind__ === "ok") {
        await loadPdfEntries();
      }
    } catch {
      // silently fail
    }
  };

  const handleTogglePdfManagement = () => {
    const next = !showPdfManagement;
    setShowPdfManagement(next);
    if (next && pdfEntries.length === 0) {
      loadPdfEntries();
    }
  };

  const sortedPaymentRequests = [...paymentRequests].sort(
    (a, b) => Number(b.submittedAt) - Number(a.submittedAt),
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className="min-h-screen px-6 py-12"
      style={{ background: "oklch(0.135 0.025 248)" }}
    >
      {/* Header + stats cards */}
      <div className="w-full max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
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
                  className="font-bold text-base"
                  style={{ color: "oklch(0.96 0.015 230)" }}
                >
                  SDR Admin
                </p>
                <p
                  className="text-sm"
                  style={{ color: "oklch(0.73 0.03 235)" }}
                >
                  Verwaltungsbereich
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg font-semibold transition-all"
              style={{
                background: "oklch(0.55 0.22 25 / 0.15)",
                color: "oklch(0.75 0.22 25)",
                border: "1px solid oklch(0.62 0.22 25 / 0.4)",
              }}
              title="Abmelden"
              data-ocid="admin.logout.button"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total visitors */}
              <div
                className="p-6 rounded-2xl text-center"
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
                {visitorLoading ? (
                  <div className="flex justify-center">
                    <Loader2
                      className="w-8 h-8 animate-spin"
                      style={{ color: "oklch(0.72 0.13 218)" }}
                    />
                  </div>
                ) : (
                  <p
                    className="font-bold text-4xl"
                    style={{ color: "oklch(0.72 0.13 218)" }}
                  >
                    {visitorCount !== null ? visitorCount.toString() : "–"}
                  </p>
                )}
              </div>

              {/* Active visitors */}
              <div
                className="p-6 rounded-2xl text-center"
                style={{
                  background: "oklch(0.55 0.15 145 / 0.08)",
                  border: "1px solid oklch(0.55 0.15 145 / 0.25)",
                }}
                data-ocid="admin.active_visitors.card"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "oklch(0.55 0.15 145 / 0.15)" }}
                >
                  <Activity
                    className="w-6 h-6"
                    style={{ color: "oklch(0.55 0.15 145)" }}
                  />
                </div>
                <p
                  className="text-sm font-medium uppercase tracking-wider mb-1"
                  style={{ color: "oklch(0.73 0.03 235)" }}
                >
                  Gerade aktiv (letzte 5 Min.)
                </p>
                {activeLoading ? (
                  <div className="flex justify-center">
                    <Loader2
                      className="w-8 h-8 animate-spin"
                      style={{ color: "oklch(0.55 0.15 145)" }}
                    />
                  </div>
                ) : (
                  <p
                    className="font-bold text-4xl"
                    style={{ color: "oklch(0.55 0.15 145)" }}
                  >
                    {activeCount !== null ? activeCount.toString() : "–"}
                  </p>
                )}
                <button
                  type="button"
                  onClick={loadActiveCount}
                  className="mt-3 text-xs px-3 py-1 rounded-lg transition-all"
                  style={{
                    color: "oklch(0.55 0.15 145)",
                    border: "1px solid oklch(0.55 0.15 145 / 0.35)",
                  }}
                >
                  Aktualisieren
                </button>
              </div>

              {/* Freigeschaltete Musterschreiben */}
              <div
                className="p-6 rounded-2xl text-center"
                style={{
                  background: "oklch(0.75 0.16 55 / 0.08)",
                  border: "1px solid oklch(0.75 0.16 55 / 0.25)",
                }}
                data-ocid="admin.musterschreiben_count.card"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "oklch(0.75 0.16 55 / 0.15)" }}
                >
                  <BookOpen
                    className="w-6 h-6"
                    style={{ color: "oklch(0.75 0.16 55)" }}
                  />
                </div>
                <p
                  className="text-sm font-medium uppercase tracking-wider mb-1"
                  style={{ color: "oklch(0.73 0.03 235)" }}
                >
                  Freigeschaltete Musterschreiben
                </p>
                {musterschreibenLoading ? (
                  <div className="flex justify-center">
                    <Loader2
                      className="w-8 h-8 animate-spin"
                      style={{ color: "oklch(0.75 0.16 55)" }}
                    />
                  </div>
                ) : (
                  <p
                    className="font-bold text-4xl"
                    style={{ color: "oklch(0.75 0.16 55)" }}
                  >
                    {musterschreibenCount !== null
                      ? musterschreibenCount.toString()
                      : "–"}
                  </p>
                )}
                <button
                  type="button"
                  onClick={loadMusterschreibenCount}
                  className="mt-3 text-xs px-3 py-1 rounded-lg transition-all"
                  style={{
                    color: "oklch(0.75 0.16 55)",
                    border: "1px solid oklch(0.75 0.16 55 / 0.35)",
                  }}
                >
                  Aktualisieren
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Payment requests – full width */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full"
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "oklch(0.17 0.03 248)",
            border: "1px solid oklch(0.27 0.055 248)",
          }}
          data-ocid="admin.payments.panel"
        >
          <button
            type="button"
            onClick={() => setShowPayments((prev) => !prev)}
            className="w-full flex items-center justify-center px-8 py-5 transition-all"
            style={{
              background: "oklch(0.17 0.03 248)",
              color: "oklch(0.96 0.015 230)",
            }}
            data-ocid="admin.payments.toggle"
          >
            <span className="font-bold" style={{ fontSize: "1.625rem" }}>
              Zahlungseingänge
            </span>
            {showPayments ? (
              <ChevronUp
                className="w-5 h-5 ml-2"
                style={{ color: "oklch(0.72 0.13 218)" }}
              />
            ) : (
              <ChevronDown
                className="w-5 h-5 ml-2"
                style={{ color: "oklch(0.72 0.13 218)" }}
              />
            )}
          </button>
          {showPayments && (
            <div className="px-8 pb-8">
              <div className="flex items-center justify-between mb-6">
                <p
                  className="text-base"
                  style={{ color: "oklch(0.73 0.03 235)" }}
                >
                  Eingegangene Ausgleiche prüfen und Musterschreiben
                  freischalten
                </p>
                <button
                  type="button"
                  onClick={loadPaymentRequests}
                  className="px-4 py-2 rounded-lg text-base font-medium transition-all"
                  style={{
                    color: "oklch(0.72 0.13 218)",
                    border: "1px solid oklch(0.72 0.13 218 / 0.35)",
                  }}
                >
                  Aktualisieren
                </button>
              </div>

              {paymentMsg && (
                <p
                  className="mb-4 text-base py-2 px-3 rounded-lg"
                  style={{
                    color: "oklch(0.55 0.15 145)",
                    background: "oklch(0.55 0.15 145 / 0.1)",
                    border: "1px solid oklch(0.55 0.15 145 / 0.2)",
                  }}
                >
                  {paymentMsg}
                </p>
              )}
              {paymentError && (
                <p
                  className="mb-4 text-base py-2 px-3 rounded-lg"
                  style={{
                    color: "oklch(0.65 0.2 27)",
                    background: "oklch(0.65 0.2 27 / 0.1)",
                    border: "1px solid oklch(0.65 0.2 27 / 0.2)",
                  }}
                >
                  {paymentError}
                </p>
              )}

              {loadingPayments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2
                    className="w-6 h-6 animate-spin"
                    style={{ color: "oklch(0.72 0.13 218)" }}
                  />
                </div>
              ) : sortedPaymentRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p
                    className="text-base"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    Keine Ausgleich-Bestätigungen vorhanden.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedPaymentRequests.map((req, i) => {
                    const txKey = `${req.nickname}-${req.txHash}`;
                    const txResult = txCheckResults[txKey] ?? null;
                    const txLoading = txCheckLoading[txKey] ?? false;

                    return (
                      <div
                        key={`${req.nickname}-${i}`}
                        className="p-5 rounded-xl"
                        style={{
                          background: "oklch(0.13 0.025 248)",
                          border: "1px solid oklch(0.27 0.055 248)",
                        }}
                        data-ocid={`admin.payments.item.${i + 1}`}
                      >
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="space-y-1 flex-1 min-w-0">
                            <p
                              className="font-bold text-base"
                              style={{ color: "oklch(0.96 0.015 230)" }}
                            >
                              {req.nickname}
                            </p>
                            <p
                              className="text-sm"
                              style={{ color: "oklch(0.73 0.03 235)" }}
                            >
                              Kryptowährung: <strong>{req.currency}</strong>
                            </p>
                            <div className="flex items-start gap-2 flex-wrap">
                              <code
                                className="text-sm font-mono break-all flex-1"
                                style={{ color: "oklch(0.73 0.03 235)" }}
                              >
                                TX-ID: {req.txHash}
                              </code>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(req.txHash);
                                  setCopiedTx(`${req.nickname}-${i}`);
                                  setTimeout(() => setCopiedTx(""), 2000);
                                }}
                                className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
                                style={{
                                  background:
                                    copiedTx === `${req.nickname}-${i}`
                                      ? "oklch(0.55 0.15 145 / 0.15)"
                                      : "oklch(0.72 0.13 218 / 0.1)",
                                  color:
                                    copiedTx === `${req.nickname}-${i}`
                                      ? "oklch(0.55 0.15 145)"
                                      : "oklch(0.72 0.13 218)",
                                  border:
                                    "1px solid oklch(0.72 0.13 218 / 0.2)",
                                }}
                                data-ocid={`admin.payments.item.${i + 1}.secondary_button`}
                              >
                                <Copy className="w-3 h-3" />
                                {copiedTx === `${req.nickname}-${i}`
                                  ? "Kopiert ✓"
                                  : "Kopieren"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleGrantAccess(req.nickname)}
                                className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                                style={{
                                  background: "oklch(0.50 0.15 145 / 0.15)",
                                  color: "oklch(0.50 0.15 145)",
                                  border:
                                    "1px solid oklch(0.50 0.15 145 / 0.3)",
                                }}
                                data-ocid={`admin.payments.item.${i + 1}.primary_button`}
                              >
                                <CheckCircle className="w-3 h-3" />{" "}
                                Musterschreiben freischalten
                              </button>
                              {/* Transaction check button */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleCheckTransaction(
                                    req.nickname,
                                    req.currency,
                                    req.txHash,
                                  )
                                }
                                disabled={txLoading}
                                className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{
                                  background: "oklch(0.72 0.13 218 / 0.12)",
                                  color: "oklch(0.72 0.13 218)",
                                  border:
                                    "1px solid oklch(0.72 0.13 218 / 0.35)",
                                }}
                                title="Transaktionsdaten aus der Blockchain abrufen und prüfen"
                                data-ocid={`admin.payments.item.${i + 1}.button`}
                              >
                                {txLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Search className="w-3 h-3" />
                                )}
                                Transaktionsdaten abrufen &amp; prüfen
                              </button>
                            </div>
                            <p
                              className="text-sm"
                              style={{ color: "oklch(0.55 0.02 235)" }}
                            >
                              {new Date(
                                Number(req.submittedAt) / 1_000_000,
                              ).toLocaleString("de-DE")}
                            </p>
                            <StatusBadge status={req.status} />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {req.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(req.nickname)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                                  style={{
                                    background: "oklch(0.55 0.15 145 / 0.15)",
                                    color: "oklch(0.55 0.15 145)",
                                    border:
                                      "1px solid oklch(0.55 0.15 145 / 0.3)",
                                  }}
                                  data-ocid={`admin.payments.item.${i + 1}.confirm_button`}
                                >
                                  <CheckCircle className="w-4 h-4" /> Genehmigen
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(req.nickname)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                                  style={{
                                    background: "oklch(0.62 0.22 25 / 0.12)",
                                    color: "oklch(0.62 0.22 25)",
                                    border:
                                      "1px solid oklch(0.62 0.22 25 / 0.3)",
                                  }}
                                  data-ocid={`admin.payments.item.${i + 1}.delete_button`}
                                >
                                  <XCircle className="w-4 h-4" /> Ablehnen
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Transaction check results panel */}
                        {txResult !== null && (
                          <TxResultPanel result={txResult} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* ODT Management – full width */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-full mt-6"
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "oklch(0.17 0.03 248)",
            border: "1px solid oklch(0.27 0.055 248)",
          }}
          data-ocid="admin.pdf_management.panel"
        >
          <button
            type="button"
            onClick={handleTogglePdfManagement}
            className="w-full flex items-center justify-center gap-2 px-8 py-5 transition-all"
            style={{
              background: "oklch(0.17 0.03 248)",
              color: "oklch(0.96 0.015 230)",
            }}
            data-ocid="admin.pdf_management.toggle"
          >
            <span className="font-bold" style={{ fontSize: "1.625rem" }}>
              Verwaltung der eingestellten ODT&apos;s
            </span>
            {showPdfManagement ? (
              <ChevronUp
                className="w-5 h-5"
                style={{ color: "oklch(0.72 0.13 218)" }}
              />
            ) : (
              <ChevronDown
                className="w-5 h-5"
                style={{ color: "oklch(0.72 0.13 218)" }}
              />
            )}
          </button>

          {showPdfManagement && (
            <div className="px-8 pb-8">
              <div className="flex items-center justify-between mb-6">
                <p
                  className="text-base"
                  style={{ color: "oklch(0.73 0.03 235)" }}
                >
                  ODT-Dateien für die vier Musterschreiben-Blöcke verwalten
                </p>
                <button
                  type="button"
                  onClick={loadPdfEntries}
                  className="px-4 py-2 rounded-lg text-base font-medium transition-all"
                  style={{
                    color: "oklch(0.72 0.13 218)",
                    border: "1px solid oklch(0.72 0.13 218 / 0.35)",
                  }}
                >
                  Aktualisieren
                </button>
              </div>

              {loadingPdfs ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2
                    className="w-6 h-6 animate-spin"
                    style={{ color: "oklch(0.72 0.13 218)" }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {PDF_BLOCKS.map((block) => {
                    const bs = getBlockUploadState(block.id);
                    return (
                      <PdfBlockCard
                        key={block.id}
                        blockId={block.id}
                        title={block.title}
                        entries={pdfEntries}
                        onUpload={handlePdfUpload}
                        onDelete={handlePdfDelete}
                        uploading={bs.uploading}
                        uploadProgress={bs.progress}
                        uploadError={bs.error}
                        uploadSuccess={bs.success}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
