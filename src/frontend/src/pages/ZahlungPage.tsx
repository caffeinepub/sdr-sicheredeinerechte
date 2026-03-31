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
  ChevronLeft,
  Clock,
  Copy,
  Loader2,
  Shield,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { CryptoAddress, PaymentRequest } from "../backend.d";
import { backend } from "../backendActor";
import { getSession } from "../utils/auth";

export default function ZahlungPage() {
  const [nickname, setNickname] = useState("");
  const [addresses, setAddresses] = useState<CryptoAddress[]>([]);
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

  useEffect(() => {
    const session = getSession();
    if (!session) {
      window.location.href = "/";
      return;
    }
    setNickname(session.nickname);
    Promise.all([
      backend.getCryptoAddresses(),
      backend.getMyPaymentStatus(session.nickname),
    ])
      .then(([addrs, status]) => {
        setAddresses(addrs);
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
              "BTC-Transaktion bestätigt! Zahlung wird verarbeitet.",
            );
          } else if (verify.__kind__ === "pending") {
            setSubmitMessage(
              "Zahlung eingereicht. BTC-Transaktion wird noch bestätigt – bitte haben Sie etwas Geduld.",
            );
          } else {
            setSubmitMessage("Zahlung eingereicht. Wird manuell geprüft.");
          }
        } else {
          setSubmitMessage(
            "Ihre Zahlung wurde eingereicht und wird geprüft. Sie erhalten Zugang sobald die Zahlung bestätigt ist.",
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

  const currencyIcons: Record<string, string> = {
    BTC: "₿",
    ETH: "Ξ",
    XMR: "ɱ",
  };
  const currencyColors: Record<string, string> = {
    BTC: "oklch(0.75 0.16 55)",
    ETH: "oklch(0.72 0.13 280)",
    XMR: "oklch(0.7 0.18 38)",
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
            Überweisen Sie den geforderten Betrag in einer der unterstützten
            Kryptowährungen an die unten angegebene Adresse. Geben Sie
            anschließend Ihren Transaktions-Hash ein, damit wir Ihre Zahlung
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
                      Zahlung bestätigt! ✓
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
                    Ihre Zahlung wird überprüft…
                  </p>
                )}
                {paymentStatus.status === "rejected" && (
                  <p
                    className="font-semibold text-lg"
                    style={{ color: "oklch(0.62 0.22 25)" }}
                  >
                    Zahlung abgelehnt. Bitte kontaktieren Sie uns.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Crypto Addresses */}
          {addresses.length > 0 ? (
            <div className="space-y-5 mb-10">
              {addresses.map((addr) => (
                <motion.div
                  key={addr.currency}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 rounded-2xl"
                  style={{
                    background: "oklch(0.17 0.03 248)",
                    border: "1px solid oklch(0.27 0.055 248)",
                  }}
                  data-ocid="zahlung.crypto.card"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="text-3xl font-bold"
                      style={{
                        color:
                          currencyColors[addr.currency] ??
                          "oklch(0.72 0.13 218)",
                      }}
                    >
                      {currencyIcons[addr.currency] ?? "💎"}
                    </span>
                    <div>
                      <p
                        className="font-bold text-xl"
                        style={{ color: "oklch(0.96 0.015 230)" }}
                      >
                        {addr.currency}
                      </p>
                      <p
                        className="text-base font-semibold"
                        style={{
                          color:
                            currencyColors[addr.currency] ??
                            "oklch(0.72 0.13 218)",
                        }}
                      >
                        Betrag: {addr.amount} {addr.currency}
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-2 p-3 rounded-xl"
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
                      data-ocid="zahlung.copy.button"
                    >
                      <Copy className="w-4 h-4" />
                      {copiedAddress === addr.address
                        ? "Kopiert ✓"
                        : "Kopieren"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div
              className="p-6 rounded-2xl mb-10 text-center"
              style={{
                background: "oklch(0.17 0.03 248)",
                border: "1px solid oklch(0.27 0.055 248)",
              }}
              data-ocid="zahlung.addresses.empty_state"
            >
              <p className="text-lg" style={{ color: "oklch(0.73 0.03 235)" }}>
                Zahlungsadressen werden vom Administrator hinterlegt. Bitte
                schauen Sie später wieder vorbei.
              </p>
            </div>
          )}

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
                Zahlung bestätigen
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
                      <SelectItem value="BTC" className="text-base">
                        ₿ Bitcoin (BTC)
                      </SelectItem>
                      <SelectItem value="ETH" className="text-base">
                        Ξ Ethereum (ETH)
                      </SelectItem>
                      <SelectItem value="XMR" className="text-base">
                        ɱ Monero (XMR)
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
                  {submitting ? "Wird geprüft…" : "Zahlung bestätigen"}
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
            <strong style={{ color: "oklch(0.72 0.13 218)" }}>Hinweis:</strong>{" "}
            Nach Bestätigung Ihrer Zahlung erhalten Sie sofort Zugang zu den
            Musterschreiben.
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
