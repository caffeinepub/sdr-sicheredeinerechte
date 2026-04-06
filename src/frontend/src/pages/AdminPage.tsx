import {
  Activity,
  AlertTriangle,
  BookOpen,
  Calculator,
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

// Known receive addresses - must match ZahlungPage.tsx and backend knownAddresses
const KNOWN_ADDRESSES: Record<string, string> = {
  ICP: "a34140f39e2ee1a1cbea4485e921060ab9b9f2afe5e595711516f665a0c6c326",
  BTC: "bc1qzt9eeuh35jc9746z0jk73dmj77gd5sp6fuc9wd",
  ETH: "0x3c2726B86B4BB25Eb39Cd58636b8f8f6a5286ae3",
  XRP: "rNxb49FgcRQVDjioZ6Jfk6vky5ViByNkW9",
  SOL: "kjFvmwSexVSufg4wu859rY7SuiqeoThQzPamPef2QLR",
};

// Frontend address match - case-insensitive, trim whitespace + quotes
function isAddressMatch(currency: string, toAddress: string): boolean {
  const known = KNOWN_ADDRESSES[currency];
  if (!known || !toAddress) return false;
  const normalize = (s: string) =>
    s
      .trim()
      .replace(/['"\\]/g, "")
      .toLowerCase();
  return normalize(known) === normalize(toAddress);
}

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

function truncateAddress(addr: string): string {
  if (!addr || addr.length <= 26) return addr;
  return `${addr.slice(0, 20)}...${addr.slice(-6)}`;
}

function TxResultPanel({
  result,
  currency,
}: { result: TxCheckResult; currency: string }) {
  const hasData = result.amount && result.amount !== "";

  // Use frontend address match as the authoritative check.
  // The backend addressMatch can be wrong due to JSON parsing artifacts.
  // Frontend has direct access to the canonical address list.
  const frontendMatch = result.toAddress
    ? isAddressMatch(currency, result.toAddress)
    : result.addressMatch;

  // eurAmount: prefer the value from backend; unwrap ICP optional array format if needed
  const rawEur = result.eurAmount;
  // Candid Opt(Float64) comes as [] | [number] - unwrap it
  const eurValue: number | null = Array.isArray(rawEur)
    ? rawEur.length > 0
      ? rawEur[0]
      : null
    : rawEur !== null && rawEur !== undefined
      ? (rawEur as number)
      : null;

  const showEur = eurValue !== null;

  // Timestamp: show if we have data even if it's "0" - try to parse robustly
  const tsDisplay = (() => {
    if (
      !result.timestamp ||
      result.timestamp === "" ||
      result.timestamp === "0"
    ) {
      return "Unbekannt";
    }
    const n = Number.parseInt(result.timestamp, 10);
    if (!n || Number.isNaN(n) || n <= 0) return "Unbekannt";
    // Sanity check: unix seconds should be > 2010-01-01 (1262304000) and < 2100
    if (n > 1262304000 && n < 4102444800) {
      return `${new Date(n * 1000).toLocaleString("de-DE", { timeZone: "UTC" })} UTC`;
    }
    return "Unbekannt";
  })();

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
              {tsDisplay}
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

      {/* Address match indicator — uses frontend verification */}
      {hasData && (
        <div>
          {frontendMatch ? (
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

      {/* Euro amount — always shown when available */}
      {hasData && (
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
                {eurValue!.toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                €
              </span>
              <span
                className="text-lg leading-none"
                style={{
                  color:
                    eurValue! > 195
                      ? "oklch(0.55 0.18 145)"
                      : "oklch(0.65 0.22 25)",
                }}
                title={eurValue! > 195 ? "Über 195 €" : "Unter 195 €"}
              >
                ●
              </span>
            </span>
          ) : (
            <span className="text-sm" style={{ color: "oklch(0.55 0.02 235)" }}>
              nicht verfügbar
            </span>
          )}
        </div>
      )}

      {/* Partial warning note (address mismatch or course unavailable) */}
      {hasData && !frontendMatch && result.toAddress && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2"
          style={{
            background: "oklch(0.62 0.22 25 / 0.08)",
            border: "1px solid oklch(0.62 0.22 25 / 0.25)",
          }}
        >
          <AlertTriangle
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            style={{ color: "oklch(0.75 0.16 55)" }}
          />
          <span className="text-xs" style={{ color: "oklch(0.75 0.16 55)" }}>
            Die abgerufene Empfangsadresse stimmt nicht mit den hinterlegten
            Adressen überein.
          </span>
        </div>
      )}
      {hasData && frontendMatch && !showEur && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2"
          style={{
            background: "oklch(0.72 0.16 55 / 0.08)",
            border: "1px solid oklch(0.72 0.16 55 / 0.2)",
          }}
        >
          <AlertTriangle
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            style={{ color: "oklch(0.75 0.16 55)" }}
          />
          <span className="text-xs" style={{ color: "oklch(0.75 0.16 55)" }}>
            Historischer Kurs nicht verfügbar – Euro-Betrag kann nicht berechnet
            werden.
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
  const [showCryptoCalculator, setShowCryptoCalculator] = useState(false);
  const [showTxDetails, setShowTxDetails] = useState(false);

  // Krypto-zu-Euro-Rechner state
  const [cryptoCurrency, setCryptoCurrency] = useState("BTC");
  const [coinAmount, setCoinAmount] = useState("");
  const [calcTimestamp, setCalcTimestamp] = useState("");
  const [euroResult, setEuroResult] = useState<number | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState("");
  const calcDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Transaktions-Details abfragen state
  const [txDetailCurrency, setTxDetailCurrency] = useState("ICP");
  const [txDetailHash, setTxDetailHash] = useState("");
  const [txDetailLoading, setTxDetailLoading] = useState(false);
  const [txDetailResult, setTxDetailResult] = useState<
    | null
    | { timestamp: string; amount: string; currency: string }
    | { error: string }
  >(null);
  const txDetailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

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

  const COINGECKO_IDS: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    ICP: "internet-computer",
    XRP: "ripple",
    SOL: "solana",
  };

  const fetchTxDetails = async (currency: string, txHash: string) => {
    if (!currency || !txHash.trim()) return;
    setTxDetailLoading(true);
    setTxDetailResult(null);
    const hash = txHash.trim();
    try {
      let timestamp = "";
      let amount = "";
      const resultCurrency = currency;

      if (currency === "ICP") {
        const resp = await fetch(
          "https://rosetta-api.internetcomputer.org/search/transactions",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              network_identifier: {
                blockchain: "Internet Computer",
                network: "00000000000000020101",
              },
              transaction_identifier: { hash },
            }),
          },
        );
        if (!resp.ok) throw new Error("ICP Rosetta API nicht erreichbar");
        const data = await resp.json();
        const tx = data?.transactions?.[0]?.transaction;
        const ops = tx?.operations ?? [];
        const receiverOp =
          ops.find((op: { amount?: { value?: string } }) => {
            const v = Number(op?.amount?.value ?? "0");
            return v > 0;
          }) ??
          ops[1] ??
          ops[0];
        const e8s = Number(receiverOp?.amount?.value ?? "0");
        amount = (Math.abs(e8s) / 100_000_000).toFixed(8);
        const tsMs = tx?.metadata?.timestamp ?? 0;
        timestamp = String(Math.floor(Number(tsMs) / 1000));
      } else if (currency === "ETH") {
        const txResp = await fetch(
          `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${hash}`,
        );
        if (!txResp.ok) throw new Error("Etherscan nicht erreichbar");
        const txData = await txResp.json();
        const txResult = txData?.result;
        if (!txResult) throw new Error("Transaktion nicht gefunden");
        const blockNum = txResult.blockNumber;
        const valueWei = BigInt(txResult.value ?? "0x0");
        amount = (Number(valueWei) / 1e18).toFixed(8);
        const blockResp = await fetch(
          `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${blockNum}&boolean=false`,
        );
        const blockData = await blockResp.json();
        const tsHex = blockData?.result?.timestamp ?? "0x0";
        timestamp = String(Number.parseInt(tsHex, 16));
      } else if (currency === "BTC") {
        const resp = await fetch(`https://blockchain.info/rawtx/${hash}`);
        if (!resp.ok) throw new Error("Blockchain.info nicht erreichbar");
        const data = await resp.json();
        timestamp = String(data?.time ?? 0);
        const outs = data?.out ?? [];
        const totalSats = outs.reduce(
          (sum: number, o: { value?: number }) => sum + (o?.value ?? 0),
          0,
        );
        amount = (totalSats / 100_000_000).toFixed(8);
      } else if (currency === "XRP") {
        const resp = await fetch(`https://api.xrpscan.com/api/v1/tx/${hash}`);
        if (!resp.ok) throw new Error("XRPScan nicht erreichbar");
        const data = await resp.json();
        const rippleEpoch = 946684800;
        timestamp = String((data?.date ?? 0) + rippleEpoch);
        const drops = Number(data?.Amount ?? data?.amount ?? "0");
        amount = (drops / 1_000_000).toFixed(6);
      } else if (currency === "SOL") {
        const resp = await fetch("https://api.mainnet-beta.solana.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getTransaction",
            params: [
              hash,
              { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
            ],
          }),
        });
        if (!resp.ok) throw new Error("Solana RPC nicht erreichbar");
        const data = await resp.json();
        const result = data?.result;
        if (!result) throw new Error("Transaktion nicht gefunden");
        timestamp = String(result?.blockTime ?? 0);
        const instructions = result?.transaction?.message?.instructions ?? [];
        let lamports = 0;
        for (const ix of instructions) {
          if (ix?.parsed?.info?.lamports) {
            lamports = ix.parsed.info.lamports;
            break;
          }
        }
        if (lamports === 0) {
          const pre = result?.meta?.preBalances ?? [];
          const post = result?.meta?.postBalances ?? [];
          if (pre.length > 1 && post.length > 1) {
            lamports = Math.abs(post[1] - pre[1]);
          }
        }
        amount = (lamports / 1_000_000_000).toFixed(9);
      }

      if (!timestamp || timestamp === "0")
        throw new Error("Zeitstempel nicht gefunden");
      // Format timestamp as "YYYY-MM-DD HH:MM" (UTC)
      let formattedTimestamp = timestamp;
      const tsNum = Number(timestamp);
      if (!Number.isNaN(tsNum) && tsNum > 0) {
        const d = new Date(tsNum * 1000);
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(d.getUTCDate()).padStart(2, "0");
        const hh = String(d.getUTCHours()).padStart(2, "0");
        const min = String(d.getUTCMinutes()).padStart(2, "0");
        formattedTimestamp = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
      }
      setTxDetailResult({
        timestamp: formattedTimestamp,
        amount,
        currency: resultCurrency,
      });
    } catch (e: unknown) {
      setTxDetailResult({
        error: e instanceof Error ? e.message : "Transaktion nicht gefunden.",
      });
    } finally {
      setTxDetailLoading(false);
    }
  };

  const fetchHistoricalEuroPrice = async (
    currency: string,
    amount: string,
    timestamp: string,
  ) => {
    if (!currency || !amount || !timestamp) return;
    const numAmount = Number.parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) return;

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const dateStr = `${day}-${month}-${year}`;

    const coinId = COINGECKO_IDS[currency];
    if (!coinId) return;

    setCalcLoading(true);
    setCalcError("");
    setEuroResult(null);

    try {
      const url = `https://api.coingecko.com/api/v3/coins/${coinId}/history?date=${dateStr}&localization=false`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("API nicht erreichbar");
      const data = await resp.json();
      const price = data?.market_data?.current_price?.eur;
      if (typeof price !== "number") throw new Error("Kurs nicht verfügbar");
      setEuroResult(price * numAmount);
    } catch (e: unknown) {
      setCalcError(
        e instanceof Error ? e.message : "Fehler beim Abrufen des Kurses",
      );
    } finally {
      setCalcLoading(false);
    }
  };

  // Debounced live calculation
  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchHistoricalEuroPrice is stable within component lifecycle
  useEffect(() => {
    if (calcDebounceRef.current) clearTimeout(calcDebounceRef.current);
    if (cryptoCurrency && coinAmount && calcTimestamp) {
      calcDebounceRef.current = setTimeout(() => {
        fetchHistoricalEuroPrice(cryptoCurrency, coinAmount, calcTimestamp);
      }, 600);
    } else {
      setEuroResult(null);
      setCalcError("");
    }
    return () => {
      if (calcDebounceRef.current) clearTimeout(calcDebounceRef.current);
    };
  }, [cryptoCurrency, coinAmount, calcTimestamp]);

  // Debounced auto-fetch for transaction details
  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchTxDetails is stable within component lifecycle
  useEffect(() => {
    if (txDetailDebounceRef.current) clearTimeout(txDetailDebounceRef.current);
    if (txDetailCurrency && txDetailHash.trim().length > 10) {
      txDetailDebounceRef.current = setTimeout(() => {
        fetchTxDetails(txDetailCurrency, txDetailHash);
      }, 800);
    } else {
      setTxDetailResult(null);
    }
    return () => {
      if (txDetailDebounceRef.current)
        clearTimeout(txDetailDebounceRef.current);
    };
  }, [txDetailCurrency, txDetailHash]);

  // Auto-fill Krypto-zu-Euro-Rechner when transaction details are loaded
  useEffect(() => {
    if (txDetailResult && !("error" in txDetailResult)) {
      setCryptoCurrency(txDetailResult.currency);
      setCoinAmount(txDetailResult.amount);
      // Convert "YYYY-MM-DD HH:MM" to datetime-local format "YYYY-MM-DDTHH:MM"
      if (txDetailResult.timestamp) {
        // Keep as "YYYY-MM-DD HH:MM" text format (text input supports paste & typing)
        setCalcTimestamp(txDetailResult.timestamp);
      }
    }
  }, [txDetailResult]);

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

      {/* Krypto-zu-Euro-Rechner & Transaktions-Details abfragen – combined */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="w-full mb-6"
      >
        {/* Collapsible header */}
        <button
          type="button"
          onClick={() => {
            const next = !(showCryptoCalculator || showTxDetails);
            setShowCryptoCalculator(next);
            setShowTxDetails(next);
          }}
          className="w-full flex items-center justify-center px-5 py-4 transition-all relative"
          style={{
            background: "oklch(0.17 0.03 248)",
            border: "1px solid oklch(0.27 0.055 248)",
            borderRadius:
              showCryptoCalculator || showTxDetails ? "1rem 1rem 0 0" : "1rem",
            cursor: "pointer",
          }}
          data-ocid="combined.toggle"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "oklch(0.72 0.13 218 / 0.15)",
                border: "1px solid oklch(0.72 0.13 218 / 0.3)",
              }}
            >
              <Calculator
                className="w-4 h-4"
                style={{ color: "oklch(0.72 0.13 218)" }}
              />
            </div>
            <h2
              className="font-bold text-lg"
              style={{ color: "oklch(0.96 0.015 230)" }}
            >
              Krypto-zu-Euro-Rechner &amp; Transaktions-Details abfragen
            </h2>
          </div>
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            {showCryptoCalculator || showTxDetails ? (
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
          </div>
        </button>

        {/* Combined tool content */}
        {(showCryptoCalculator || showTxDetails) && (
          <div
            style={{
              background: "oklch(0.17 0.03 248)",
              border: "1px solid oklch(0.27 0.055 248)",
              borderTop: "none",
              borderRadius: "0 0 1rem 1rem",
            }}
          >
            {/* ── Transaktions-Details abfragen ── */}
            <div
              className="p-6 border-b"
              style={{ borderColor: "oklch(0.27 0.055 248)" }}
            >
              <h3
                className="font-semibold text-base mb-4 flex items-center gap-2"
                style={{ color: "oklch(0.72 0.13 218)" }}
              >
                <Search className="w-4 h-4" />
                Transaktions-Details abfragen
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {/* Currency dropdown */}
                <div>
                  <label
                    htmlFor="txd-currency"
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    Blockchain-Kürzel
                  </label>
                  <select
                    id="txd-currency"
                    value={txDetailCurrency}
                    onChange={(e) => setTxDetailCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
                    style={{
                      background: "oklch(0.13 0.025 248)",
                      border: "1px solid oklch(0.32 0.06 248)",
                      color: "oklch(0.96 0.015 230)",
                    }}
                  >
                    <option value="ICP">ICP – Internet Computer</option>
                    <option value="BTC">BTC – Bitcoin</option>
                    <option value="ETH">ETH – Ethereum</option>
                    <option value="XRP">XRP – Ripple</option>
                    <option value="SOL">SOL – Solana</option>
                  </select>
                </div>

                {/* TX Hash */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="txd-hash"
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    Transaction-Hash
                  </label>
                  <input
                    id="txd-hash"
                    type="text"
                    value={txDetailHash}
                    onChange={(e) => setTxDetailHash(e.target.value)}
                    placeholder="Vollständigen TX-Hash eingeben…"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all font-mono"
                    style={{
                      background: "oklch(0.13 0.025 248)",
                      border: "1px solid oklch(0.32 0.06 248)",
                      color: "oklch(0.96 0.015 230)",
                    }}
                  />
                </div>
              </div>

              {/* Result fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    Zeitstempel (UTC)
                  </p>
                  <div
                    className="w-full px-3 py-2.5 rounded-xl text-sm min-h-[42px] flex items-center"
                    style={{
                      background: "oklch(0.13 0.025 248)",
                      border: "1px solid oklch(0.32 0.06 248)",
                      color: txDetailLoading
                        ? "oklch(0.72 0.13 218)"
                        : txDetailResult &&
                            !("error" in txDetailResult) &&
                            txDetailResult.timestamp
                          ? "oklch(0.55 0.15 145)"
                          : "oklch(0.45 0.03 235)",
                    }}
                  >
                    {txDetailLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Abrufen…
                      </span>
                    ) : txDetailResult && !("error" in txDetailResult) ? (
                      txDetailResult.timestamp || "–"
                    ) : (
                      <span style={{ color: "oklch(0.45 0.03 235)" }}>
                        – wird angezeigt
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    Anzahl der Coins
                  </p>
                  <div
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-bold min-h-[42px] flex items-center"
                    style={{
                      background: "oklch(0.13 0.025 248)",
                      border: "1px solid oklch(0.32 0.06 248)",
                      color: txDetailLoading
                        ? "oklch(0.72 0.13 218)"
                        : txDetailResult &&
                            !("error" in txDetailResult) &&
                            txDetailResult.amount
                          ? "oklch(0.55 0.15 145)"
                          : "oklch(0.45 0.03 235)",
                    }}
                  >
                    {txDetailLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Abrufen…
                      </span>
                    ) : txDetailResult && !("error" in txDetailResult) ? (
                      `${txDetailResult.amount} ${txDetailResult.currency}`
                    ) : (
                      <span style={{ color: "oklch(0.45 0.03 235)" }}>
                        – wird angezeigt
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {txDetailResult && "error" in txDetailResult && (
                <div
                  className="mb-4 px-3 py-2.5 rounded-xl text-sm"
                  style={{
                    background: "oklch(0.62 0.22 25 / 0.1)",
                    border: "1px solid oklch(0.62 0.22 25 / 0.3)",
                    color: "oklch(0.62 0.22 25)",
                  }}
                >
                  {txDetailResult.error}
                </div>
              )}

              <button
                type="button"
                onClick={() => fetchTxDetails(txDetailCurrency, txDetailHash)}
                disabled={txDetailLoading || !txDetailHash.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "oklch(0.72 0.13 218 / 0.15)",
                  color: "oklch(0.72 0.13 218)",
                  border: "1px solid oklch(0.72 0.13 218 / 0.4)",
                }}
              >
                Transaktion abfragen
              </button>
            </div>

            {/* ── Krypto-zu-Euro-Rechner ── */}
            <div className="p-6">
              <h3
                className="font-semibold text-base mb-4 flex items-center gap-2"
                style={{ color: "oklch(0.72 0.13 218)" }}
              >
                <Calculator className="w-4 h-4" />
                Krypto-zu-Euro-Rechner
              </h3>

              {/* Block-Explorer Links */}
              <div
                className="mb-5 flex flex-col gap-1.5"
                style={{
                  background: "oklch(0.14 0.03 248)",
                  border: "1px solid oklch(0.27 0.055 248)",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                }}
              >
                <a
                  href="https://www.oklink.com/de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                  style={{ color: "oklch(0.72 0.13 218)" }}
                >
                  <span style={{ color: "oklch(0.65 0.03 235)" }}>
                    Block-Explorer [für BTC, ETH, SOL]
                  </span>
                  <span
                    style={{
                      color: "oklch(0.72 0.13 218)",
                      textDecoration: "underline",
                    }}
                  >
                    https://www.oklink.com/de
                  </span>
                </a>
                <a
                  href="https://blockchair.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                  style={{ color: "oklch(0.72 0.13 218)" }}
                >
                  <span style={{ color: "oklch(0.65 0.03 235)" }}>
                    Block-Explorer [für BTC, ETH, XRP]
                  </span>
                  <span
                    style={{
                      color: "oklch(0.72 0.13 218)",
                      textDecoration: "underline",
                    }}
                  >
                    https://blockchair.com/
                  </span>
                </a>
                <a
                  href="https://dashboard.internetcomputer.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                  style={{ color: "oklch(0.72 0.13 218)" }}
                >
                  <span style={{ color: "oklch(0.65 0.03 235)" }}>
                    Block-Explorer [für ICP]
                  </span>
                  <span
                    style={{
                      color: "oklch(0.72 0.13 218)",
                      textDecoration: "underline",
                    }}
                  >
                    https://dashboard.internetcomputer.org/
                  </span>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {/* Currency dropdown */}
                <div>
                  <label
                    htmlFor="calc-currency"
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    Kryptowährung
                  </label>
                  <select
                    id="calc-currency"
                    value={cryptoCurrency}
                    onChange={(e) => setCryptoCurrency(e.target.value)}
                    data-ocid="calc.select"
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
                    style={{
                      background: "oklch(0.13 0.025 248)",
                      border: "1px solid oklch(0.32 0.06 248)",
                      color: "oklch(0.96 0.015 230)",
                    }}
                  >
                    <option value="BTC">BTC – Bitcoin</option>
                    <option value="ETH">ETH – Ethereum</option>
                    <option value="ICP">ICP – Internet Computer</option>
                    <option value="XRP">XRP – Ripple</option>
                    <option value="SOL">SOL – Solana</option>
                  </select>
                </div>

                {/* Coin amount */}
                <div>
                  <label
                    htmlFor="calc-amount"
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    Anzahl der Coins
                  </label>
                  <input
                    id="calc-amount"
                    type="number"
                    min="0"
                    step="any"
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(e.target.value)}
                    placeholder="z.B. 1.5"
                    data-ocid="calc.input"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "oklch(0.13 0.025 248)",
                      border: "1px solid oklch(0.32 0.06 248)",
                      color: "oklch(0.96 0.015 230)",
                    }}
                  />
                </div>

                {/* Timestamp */}
                <div>
                  <label
                    htmlFor="calc-timestamp"
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    Zeitstempel (z.B. 2025-04-06 14:30)
                  </label>
                  <input
                    id="calc-timestamp"
                    type="text"
                    value={calcTimestamp}
                    onChange={(e) => setCalcTimestamp(e.target.value)}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData("text").trim();
                      e.preventDefault();
                      const normalized = pasted
                        .replace("T", " ")
                        .replace(/:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/, "")
                        .slice(0, 16);
                      setCalcTimestamp(normalized);
                    }}
                    placeholder="YYYY-MM-DD HH:MM"
                    data-ocid="calc.timestamp.input"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "oklch(0.13 0.025 248)",
                      border: "1px solid oklch(0.32 0.06 248)",
                      color: "oklch(0.96 0.015 230)",
                    }}
                  />
                </div>
              </div>

              {/* Result + Button row */}
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <p
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    Euro-Betrag (historisch)
                  </p>
                  <div
                    data-ocid="calc.success_state"
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-bold min-h-[42px] flex items-center"
                    style={{
                      background: "oklch(0.13 0.025 248)",
                      border: "1px solid oklch(0.32 0.06 248)",
                      color: calcLoading
                        ? "oklch(0.72 0.13 218)"
                        : euroResult !== null
                          ? "oklch(0.55 0.15 145)"
                          : "oklch(0.55 0.03 235)",
                    }}
                  >
                    {calcLoading ? (
                      <span
                        className="flex items-center gap-2"
                        data-ocid="calc.loading_state"
                      >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Berechne…
                      </span>
                    ) : calcError ? (
                      <span
                        data-ocid="calc.error_state"
                        style={{
                          color: "oklch(0.62 0.22 25)",
                          fontWeight: 400,
                          fontSize: "0.8rem",
                        }}
                      >
                        {calcError}
                      </span>
                    ) : euroResult !== null ? (
                      `${euroResult.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
                    ) : (
                      <span style={{ color: "oklch(0.45 0.03 235)" }}>
                        – Bitte alle Felder ausfüllen
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    fetchHistoricalEuroPrice(
                      cryptoCurrency,
                      coinAmount,
                      calcTimestamp,
                    )
                  }
                  disabled={calcLoading || !coinAmount || !calcTimestamp}
                  data-ocid="calc.primary_button"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  style={{
                    background: "oklch(0.72 0.13 218 / 0.15)",
                    color: "oklch(0.72 0.13 218)",
                    border: "1px solid oklch(0.72 0.13 218 / 0.4)",
                  }}
                >
                  Jetzt berechnen
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

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
                          <TxResultPanel
                            result={txResult}
                            currency={req.currency}
                          />
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
