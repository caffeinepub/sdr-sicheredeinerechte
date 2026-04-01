import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock,
  Copy,
  Loader2,
  Shield,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { SiBitcoin, SiEthereum, SiSolana } from "react-icons/si";
import type { PaymentRequest } from "../backend.d";
import { backend } from "../backendActor";
import { getSession } from "../utils/auth";

const HARDCODED_ADDRESSES = [
  {
    currency: "ICP",
    name: "Internet Computer",
    address: "3pno5-fmoey-3jsyu-6p5qb-6egd7-zg445-sfdtc-3cpzh-qn5sh-wcgx6-cae",
    color: "oklch(0.72 0.13 218)",
    symbol: "∞",
  },
  {
    currency: "BTC",
    name: "Bitcoin",
    address: "bc1qzt9eeuh35jc9746z0jk73dmj77gd5sp6fuc9wd",
    color: "oklch(0.75 0.16 55)",
    symbol: "₿",
  },
  {
    currency: "ETH",
    name: "Ethereum",
    address: "0x3c2726B86B4BB25Eb39Cd58636b8f8f6a5286ae3",
    color: "oklch(0.72 0.13 280)",
    symbol: "Ξ",
  },
  {
    currency: "XRP",
    name: "XRP",
    address: "rNxb49FgcRQVDjioZ6Jfk6vky5ViByNkW9",
    color: "oklch(0.70 0.12 230)",
    symbol: "✕",
  },
  {
    currency: "SOL",
    name: "Solana",
    address: "kjFvmwSexVSufg4wu859rY7SuiqeoThQzPamPef2QLR",
    color: "oklch(0.72 0.15 310)",
    symbol: "◎",
  },
];

function CurrencyIcon({
  currency,
  color,
  symbol,
}: {
  currency: string;
  color: string;
  symbol: string;
}) {
  const iconStyle = { color, fontSize: "2rem" };
  if (currency === "BTC") return <SiBitcoin style={iconStyle} />;
  if (currency === "ETH") return <SiEthereum style={iconStyle} />;
  if (currency === "SOL") return <SiSolana style={iconStyle} />;
  return (
    <span className="text-3xl font-bold leading-none" style={{ color }}>
      {symbol}
    </span>
  );
}

export default function ZahlungPage() {
  const [nickname, setNickname] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentRequest | null>(
    null,
  );
  const [loadingData, setLoadingData] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [copiedAddress, setCopiedAddress] = useState("");
  const [expandedQR, setExpandedQR] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      window.location.href = "/";
      return;
    }
    setNickname(session.nickname);
    backend
      .getMyPaymentStatus(session.nickname)
      .then((status) => {
        setPaymentStatus(status);
      })
      .finally(() => setLoadingData(false));
  }, []);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(""), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCurrency || !txHash.trim()) return;
    setSubmitting(true);
    setSubmitMessage("");
    setSubmitError("");
    try {
      const result = await backend.submitPaymentProof(
        nickname,
        selectedCurrency,
        txHash.trim(),
      );
      if (result.__kind__ === "error") {
        setSubmitError(result.error);
      } else {
        if (selectedCurrency === "BTC") {
          const verify = await backend.verifyBTCTransaction(
            txHash.trim(),
            nickname,
          );
          if (verify.__kind__ === "confirmed") {
            setSubmitMessage(
              "BTC-Transaktion bestätigt! Ausgleich wird verarbeitet.",
            );
          } else if (verify.__kind__ === "pending") {
            setSubmitMessage(
              "Ausgleich eingereicht. BTC-Transaktion wird noch bestätigt – bitte haben Sie etwas Geduld.",
            );
          } else {
            setSubmitMessage("Ausgleich eingereicht. Wird manuell geprüft.");
          }
        } else {
          setSubmitMessage(
            "Ihr Ausgleich wurde eingereicht und wird geprüft. Sie erhalten Zugang sobald der Ausgleich bestätigt ist.",
          );
        }
        const updated = await backend.getMyPaymentStatus(nickname);
        setPaymentStatus(updated);
        setTxHash("");
      }
    } catch {
      setSubmitError("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "oklch(0.135 0.025 248)" }}
        data-ocid="zahlung.loading_state"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: "oklch(0.72 0.13 218)" }}
          />
          <p className="text-lg" style={{ color: "oklch(0.73 0.03 235)" }}>
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
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
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
          <button
            type="button"
            onClick={() => {
              window.location.href = "/app";
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all"
            style={{
              color: "oklch(0.73 0.03 235)",
              border: "1px solid oklch(0.27 0.055 248)",
            }}
            data-ocid="zahlung.back.button"
          >
            <ChevronLeft className="w-4 h-4" />
            Zurück
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="font-bold text-3xl sm:text-4xl mb-3"
            style={{ color: "oklch(0.96 0.015 230)" }}
          >
            Musterschreiben freischalten
          </h1>
          <p
            className="text-lg leading-relaxed mb-10"
            style={{ color: "oklch(0.73 0.03 235)" }}
          >
            Überweisen Sie den geforderten Ausgleich in einer der unterstützten
            Kryptowährungen an die unten angegebene Adresse. Geben Sie
            anschließend Ihren Transaktions-Hash ein, damit wir Ihren Ausgleich
            bestätigen können.
          </p>

          {/* Payment Status Banner */}
          {paymentStatus && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-5 rounded-2xl flex items-center gap-4"
              style={{
                background:
                  paymentStatus.status === "confirmed"
                    ? "oklch(0.55 0.15 145 / 0.12)"
                    : paymentStatus.status === "rejected"
                      ? "oklch(0.62 0.22 25 / 0.12)"
                      : "oklch(0.72 0.13 218 / 0.1)",
                border: `1px solid ${
                  paymentStatus.status === "confirmed"
                    ? "oklch(0.55 0.15 145 / 0.35)"
                    : paymentStatus.status === "rejected"
                      ? "oklch(0.62 0.22 25 / 0.35)"
                      : "oklch(0.72 0.13 218 / 0.3)"
                }`,
              }}
              data-ocid="zahlung.payment_status.panel"
            >
              {paymentStatus.status === "confirmed" && (
                <CheckCircle
                  className="w-7 h-7 flex-shrink-0"
                  style={{ color: "oklch(0.55 0.15 145)" }}
                />
              )}
              {paymentStatus.status === "pending" && (
                <Clock
                  className="w-7 h-7 flex-shrink-0"
                  style={{ color: "oklch(0.72 0.13 218)" }}
                />
              )}
              {paymentStatus.status === "rejected" && (
                <XCircle
                  className="w-7 h-7 flex-shrink-0"
                  style={{ color: "oklch(0.62 0.22 25)" }}
                />
              )}
              <div className="flex-1">
                {paymentStatus.status === "confirmed" && (
                  <>
                    <p
                      className="font-semibold text-lg"
                      style={{ color: "oklch(0.55 0.15 145)" }}
                    >
                      Ausgleich bestätigt! ✓
                    </p>
                    <p
                      className="text-base mt-1"
                      style={{ color: "oklch(0.73 0.03 235)" }}
                    >
                      Ihr Zugang zu den Musterschreiben ist freigeschaltet.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = "/musterschreiben";
                      }}
                      className="mt-3 px-5 py-2.5 rounded-xl text-base font-semibold transition-all"
                      style={{
                        background: "oklch(0.55 0.15 145)",
                        color: "#fff",
                      }}
                      data-ocid="zahlung.open_musterschreiben.button"
                    >
                      Musterschreiben öffnen →
                    </button>
                  </>
                )}
                {paymentStatus.status === "pending" && (
                  <p
                    className="font-semibold text-lg"
                    style={{ color: "oklch(0.72 0.13 218)" }}
                  >
                    Ihr Ausgleich wird überprüft…
                  </p>
                )}
                {paymentStatus.status === "rejected" && (
                  <p
                    className="font-semibold text-lg"
                    style={{ color: "oklch(0.62 0.22 25)" }}
                  >
                    Ausgleich abgelehnt. Bitte kontaktieren Sie uns.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Hardcoded Crypto Addresses */}
          <div className="space-y-5 mb-10">
            {HARDCODED_ADDRESSES.map((addr, idx) => (
              <motion.div
                key={addr.currency}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07 }}
                className="p-6 rounded-2xl"
                style={{
                  background: "oklch(0.17 0.03 248)",
                  border: `1px solid ${addr.color}40`,
                }}
                data-ocid={`zahlung.crypto.card.${idx + 1}` as string}
              >
                <div className="flex items-center gap-3 mb-4">
                  <CurrencyIcon
                    currency={addr.currency}
                    color={addr.color}
                    symbol={addr.symbol}
                  />
                  <p
                    className="font-bold text-xl"
                    style={{ color: "oklch(0.96 0.015 230)" }}
                  >
                    {addr.name}{" "}
                    <span
                      className="text-base font-semibold"
                      style={{ color: addr.color }}
                    >
                      ({addr.currency})
                    </span>
                  </p>
                </div>

                <div
                  className="flex items-center gap-2 p-3 rounded-xl mb-4"
                  style={{
                    background: "oklch(0.13 0.025 248)",
                    border: "1px solid oklch(0.27 0.055 248)",
                  }}
                >
                  <code
                    className="flex-1 text-sm break-all font-mono"
                    style={{ color: "oklch(0.82 0.06 225)" }}
                  >
                    {addr.address}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(addr.address)}
                    className="flex-shrink-0 p-2 rounded-lg transition-all flex items-center gap-1.5 text-sm font-medium"
                    style={{
                      background:
                        copiedAddress === addr.address
                          ? "oklch(0.55 0.15 145 / 0.15)"
                          : "oklch(0.72 0.13 218 / 0.1)",
                      color:
                        copiedAddress === addr.address
                          ? "oklch(0.55 0.15 145)"
                          : "oklch(0.72 0.13 218)",
                      border: "1px solid oklch(0.72 0.13 218 / 0.2)",
                    }}
                    data-ocid={`zahlung.copy.button.${idx + 1}` as string}
                  >
                    <Copy className="w-4 h-4" />
                    {copiedAddress === addr.address ? "Kopiert ✓" : "Kopieren"}
                  </button>
                </div>

                {/* QR Code Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedQR(
                        expandedQR === addr.currency ? null : addr.currency,
                      )
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: "oklch(0.13 0.025 248)",
                      color: "oklch(0.73 0.03 235)",
                      border: "1px solid oklch(0.27 0.055 248)",
                    }}
                    data-ocid={`zahlung.qr.toggle.${idx + 1}` as string}
                  >
                    {expandedQR === addr.currency ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    {expandedQR === addr.currency
                      ? "QR-Code ausblenden"
                      : "QR-Code anzeigen"}
                  </button>
                  {expandedQR === addr.currency && (
                    <div className="mt-4 flex justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(addr.address)}&bgcolor=1e2a3a&color=a0c4d8`}
                        alt={`QR-Code für ${addr.currency} Adresse ${addr.address}`}
                        width={180}
                        height={180}
                        className="rounded-xl"
                        style={{ border: `2px solid ${addr.color}60` }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Payment Proof Form */}
          {(!paymentStatus || paymentStatus.status === "rejected") && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-2xl"
              style={{
                background: "oklch(0.17 0.03 248)",
                border: "1px solid oklch(0.27 0.055 248)",
              }}
            >
              <h2
                className="font-bold text-2xl mb-2"
                style={{ color: "oklch(0.96 0.015 230)" }}
              >
                Ausgleich bestätigen
              </h2>
              <p
                className="text-base mb-6"
                style={{ color: "oklch(0.73 0.03 235)" }}
              >
                Nach der Überweisung geben Sie bitte Ihren Transaktions-Hash
                ein.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    className="text-base"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    Kryptowährung
                  </Label>
                  <Select
                    value={selectedCurrency}
                    onValueChange={setSelectedCurrency}
                  >
                    <SelectTrigger
                      className="text-base"
                      style={{
                        background: "oklch(0.13 0.03 248)",
                        border: "1px solid oklch(0.27 0.055 248)",
                        color: "oklch(0.96 0.015 230)",
                      }}
                      data-ocid="zahlung.currency.select"
                    >
                      <SelectValue placeholder="Währung auswählen" />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        background: "oklch(0.17 0.03 248)",
                        border: "1px solid oklch(0.27 0.055 248)",
                      }}
                    >
                      <SelectItem value="ICP" className="text-base">
                        ∞ ICP
                      </SelectItem>
                      <SelectItem value="BTC" className="text-base">
                        ₿ Bitcoin (BTC)
                      </SelectItem>
                      <SelectItem value="ETH" className="text-base">
                        Ξ Ethereum (ETH)
                      </SelectItem>
                      <SelectItem value="XRP" className="text-base">
                        ✕ XRP
                      </SelectItem>
                      <SelectItem value="SOL" className="text-base">
                        ◎ Solana (SOL)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    className="text-base"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    Transaktions-Hash (TX-ID)
                  </Label>
                  <Input
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="z.B. 3a1b2c..."
                    className="text-base font-mono"
                    style={{
                      background: "oklch(0.13 0.03 248)",
                      border: "1px solid oklch(0.27 0.055 248)",
                      color: "oklch(0.96 0.015 230)",
                    }}
                    data-ocid="zahlung.txhash.input"
                  />
                </div>
                {submitError && (
                  <p
                    className="text-base py-2 px-3 rounded-lg"
                    style={{
                      color: "oklch(0.65 0.2 27)",
                      background: "oklch(0.65 0.2 27 / 0.1)",
                      border: "1px solid oklch(0.65 0.2 27 / 0.2)",
                    }}
                    data-ocid="zahlung.error_state"
                  >
                    {submitError}
                  </p>
                )}
                {submitMessage && (
                  <p
                    className="text-base py-2 px-3 rounded-lg"
                    style={{
                      color: "oklch(0.55 0.15 145)",
                      background: "oklch(0.55 0.15 145 / 0.1)",
                      border: "1px solid oklch(0.55 0.15 145 / 0.2)",
                    }}
                    data-ocid="zahlung.success_state"
                  >
                    {submitMessage}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting || !selectedCurrency || !txHash.trim()}
                  className="w-full py-3 rounded-xl text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  style={{
                    background: "oklch(0.72 0.13 218)",
                    color: "oklch(0.135 0.025 248)",
                  }}
                  data-ocid="zahlung.submit_button"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : null}
                  {submitting ? "Wird geprüft…" : "Ausgleich bestätigen"}
                </button>
              </form>
            </motion.div>
          )}

          {/* Hint */}
          <div
            className="mt-8 p-5 rounded-xl text-base"
            style={{
              background: "oklch(0.72 0.13 218 / 0.06)",
              border: "1px solid oklch(0.72 0.13 218 / 0.2)",
              color: "oklch(0.73 0.03 235)",
            }}
          >
            Nach Bestätigung Ihres Ausgleichs erhalten Sie innerhalb von 24
            Stunden Zugang zu den Musterschreiben.
          </div>
        </motion.div>
      </main>

      <footer
        className="py-8 px-6 mt-12"
        style={{ borderTop: "1px solid oklch(0.27 0.055 248)" }}
      >
        <div className="max-w-4xl mx-auto text-center">
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
