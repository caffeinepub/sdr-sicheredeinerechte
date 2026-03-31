import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { PaymentRequest } from "../backend.d";
import { backend } from "../backendActor";

function StatusBadge({ status }: { status: string }) {
  const configs: Record<
    string,
    { label: string; color: string; bg: string; border: string }
  > = {
    confirmed: {
      label: "Best\u00e4tigt",
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

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [visitorCount, setVisitorCount] = useState<bigint | null>(null);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const [btcAddress, setBtcAddress] = useState("");
  const [btcAmount, setBtcAmount] = useState("");
  const [ethAddress, setEthAddress] = useState("");
  const [ethAmount, setEthAmount] = useState("");
  const [xmrAddress, setXmrAddress] = useState("");
  const [xmrAmount, setXmrAmount] = useState("");
  const [savingAddresses, setSavingAddresses] = useState(false);
  const [addressMsg, setAddressMsg] = useState("");
  const [addressError, setAddressError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");
    setVisitorCount(null);
    try {
      const result = await backend.getVisitorCount(password);
      if (result.__kind__ === "error") {
        setError("Ung\u00fcltiges Passwort.");
      } else {
        setVisitorCount(result.ok);
        loadPaymentRequests();
      }
    } catch {
      setError("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentRequests = async () => {
    setLoadingPayments(true);
    try {
      const result = await backend.getAllPaymentRequests(password);
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
      const result = await backend.approvePayment(password, nickname);
      if (result.__kind__ === "ok") {
        setPaymentMsg(`Zahlung f\u00fcr "${nickname}" genehmigt.`);
        loadPaymentRequests();
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
      const result = await backend.rejectPayment(password, nickname);
      if (result.__kind__ === "ok") {
        setPaymentMsg(`Zahlung f\u00fcr "${nickname}" abgelehnt.`);
        loadPaymentRequests();
      } else {
        setPaymentError(result.error);
      }
    } catch {
      setPaymentError("Verbindungsfehler.");
    }
  };

  const handleSaveAddresses = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddresses(true);
    setAddressMsg("");
    setAddressError("");
    try {
      await Promise.all([
        btcAddress && btcAmount
          ? backend.setCryptoAddress(password, "BTC", btcAddress, btcAmount)
          : Promise.resolve(null),
        ethAddress && ethAmount
          ? backend.setCryptoAddress(password, "ETH", ethAddress, ethAmount)
          : Promise.resolve(null),
        xmrAddress && xmrAmount
          ? backend.setCryptoAddress(password, "XMR", xmrAddress, xmrAmount)
          : Promise.resolve(null),
      ]);
      setAddressMsg("Krypto-Adressen erfolgreich gespeichert.");
    } catch {
      setAddressError("Fehler beim Speichern der Adressen.");
    } finally {
      setSavingAddresses(false);
    }
  };

  const cryptoRows = [
    {
      currency: "BTC",
      icon: "\u20bf",
      address: btcAddress,
      setAddress: setBtcAddress,
      amount: btcAmount,
      setAmount: setBtcAmount,
    },
    {
      currency: "ETH",
      icon: "\u039e",
      address: ethAddress,
      setAddress: setEthAddress,
      amount: ethAmount,
      setAmount: setEthAmount,
    },
    {
      currency: "XMR",
      icon: "\u0271",
      address: xmrAddress,
      setAddress: setXmrAddress,
      amount: xmrAmount,
      setAmount: setXmrAmount,
    },
  ];

  return (
    <div
      className="min-h-screen px-6 py-12"
      style={{ background: "oklch(0.135 0.025 248)" }}
    >
      <div className="w-full max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-8">
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
              <p className="text-sm" style={{ color: "oklch(0.73 0.03 235)" }}>
                Verwaltungsbereich
              </p>
            </div>
          </div>

          <div
            className="p-8 rounded-2xl mb-8"
            style={{
              background: "oklch(0.17 0.03 248)",
              border: "1px solid oklch(0.27 0.055 248)",
            }}
            data-ocid="admin.panel"
          >
            <h1
              className="font-bold text-xl mb-1"
              style={{ color: "oklch(0.96 0.015 230)" }}
            >
              Admin-Zugang
            </h1>
            <p
              className="text-base mb-6"
              style={{ color: "oklch(0.73 0.03 235)" }}
            >
              Geben Sie das Admin-Passwort ein.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  className="text-base"
                  style={{ color: "oklch(0.73 0.03 235)" }}
                >
                  Admin-Passwort
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Passwort eingeben"
                    disabled={loading}
                    autoComplete="current-password"
                    className="text-base"
                    style={{
                      background: "oklch(0.13 0.03 248)",
                      border: "1px solid oklch(0.27 0.055 248)",
                      color: "oklch(0.96 0.015 230)",
                      paddingRight: "2.5rem",
                    }}
                    data-ocid="admin.password.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  className="text-base py-2 px-3 rounded-lg"
                  style={{
                    color: "oklch(0.65 0.2 27)",
                    background: "oklch(0.65 0.2 27 / 0.1)",
                    border: "1px solid oklch(0.65 0.2 27 / 0.2)",
                  }}
                  data-ocid="admin.error_state"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-2.5 rounded-xl text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                style={{
                  background: "oklch(0.72 0.13 218)",
                  color: "oklch(0.135 0.025 248)",
                }}
                data-ocid="admin.submit_button"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Wird gepr\u00fcft\u2026" : "Admin-Zugang"}
              </button>
            </form>

            {visitorCount !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-6 p-6 rounded-xl text-center"
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
                <p
                  className="font-bold text-4xl"
                  style={{ color: "oklch(0.72 0.13 218)" }}
                  data-ocid="admin.success_state"
                >
                  {visitorCount.toString()}
                </p>
              </motion.div>
            )}
          </div>

          {visitorCount !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {/* Crypto addresses */}
              <div
                className="p-8 rounded-2xl mb-6"
                style={{
                  background: "oklch(0.17 0.03 248)",
                  border: "1px solid oklch(0.27 0.055 248)",
                }}
                data-ocid="admin.crypto_addresses.panel"
              >
                <h2
                  className="font-bold text-xl mb-1"
                  style={{ color: "oklch(0.96 0.015 230)" }}
                >
                  Krypto-Adressen hinterlegen
                </h2>
                <p
                  className="text-base mb-6"
                  style={{ color: "oklch(0.73 0.03 235)" }}
                >
                  Tragen Sie die Empfangsadressen und den geforderten Betrag je
                  W\u00e4hrung ein.
                </p>
                <form onSubmit={handleSaveAddresses} className="space-y-5">
                  {cryptoRows.map(
                    ({
                      currency,
                      icon,
                      address,
                      setAddress,
                      amount,
                      setAmount,
                    }) => (
                      <div
                        key={currency}
                        className="p-5 rounded-xl space-y-3"
                        style={{
                          background: "oklch(0.13 0.025 248)",
                          border: "1px solid oklch(0.27 0.055 248)",
                        }}
                      >
                        <p
                          className="font-bold text-base"
                          style={{ color: "oklch(0.96 0.015 230)" }}
                        >
                          {icon} {currency}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label
                              className="text-sm"
                              style={{ color: "oklch(0.73 0.03 235)" }}
                            >
                              Empfangsadresse
                            </Label>
                            <Input
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder={`${currency}-Adresse`}
                              className="text-sm font-mono"
                              style={{
                                background: "oklch(0.17 0.03 248)",
                                border: "1px solid oklch(0.27 0.055 248)",
                                color: "oklch(0.96 0.015 230)",
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label
                              className="text-sm"
                              style={{ color: "oklch(0.73 0.03 235)" }}
                            >
                              Betrag
                            </Label>
                            <Input
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="z.B. 0.001"
                              className="text-sm"
                              style={{
                                background: "oklch(0.17 0.03 248)",
                                border: "1px solid oklch(0.27 0.055 248)",
                                color: "oklch(0.96 0.015 230)",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                  {addressError && (
                    <p
                      className="text-base py-2 px-3 rounded-lg"
                      style={{
                        color: "oklch(0.65 0.2 27)",
                        background: "oklch(0.65 0.2 27 / 0.1)",
                        border: "1px solid oklch(0.65 0.2 27 / 0.2)",
                      }}
                      data-ocid="admin.address.error_state"
                    >
                      {addressError}
                    </p>
                  )}
                  {addressMsg && (
                    <p
                      className="text-base py-2 px-3 rounded-lg"
                      style={{
                        color: "oklch(0.55 0.15 145)",
                        background: "oklch(0.55 0.15 145 / 0.1)",
                        border: "1px solid oklch(0.55 0.15 145 / 0.2)",
                      }}
                      data-ocid="admin.address.success_state"
                    >
                      {addressMsg}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={savingAddresses}
                    className="w-full py-2.5 rounded-xl text-base font-semibold transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    style={{
                      background: "oklch(0.72 0.13 218)",
                      color: "oklch(0.135 0.025 248)",
                    }}
                    data-ocid="admin.save_addresses.button"
                  >
                    {savingAddresses ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null}
                    {savingAddresses
                      ? "Wird gespeichert\u2026"
                      : "Adressen speichern"}
                  </button>
                </form>
              </div>

              {/* Payment requests */}
              <div
                className="p-8 rounded-2xl"
                style={{
                  background: "oklch(0.17 0.03 248)",
                  border: "1px solid oklch(0.27 0.055 248)",
                }}
                data-ocid="admin.payments.panel"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2
                      className="font-bold text-xl"
                      style={{ color: "oklch(0.96 0.015 230)" }}
                    >
                      Zahlungsanfragen
                    </h2>
                    <p
                      className="text-base"
                      style={{ color: "oklch(0.73 0.03 235)" }}
                    >
                      Zahlungen genehmigen oder ablehnen
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadPaymentRequests}
                    className="px-4 py-2 rounded-lg text-base font-medium transition-all"
                    style={{
                      color: "oklch(0.72 0.13 218)",
                      border: "1px solid oklch(0.72 0.13 218 / 0.35)",
                    }}
                    data-ocid="admin.refresh_payments.button"
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
                    data-ocid="admin.payment_action.success_state"
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
                    data-ocid="admin.payment_action.error_state"
                  >
                    {paymentError}
                  </p>
                )}

                {loadingPayments ? (
                  <div
                    className="flex items-center justify-center py-8"
                    data-ocid="admin.payments.loading_state"
                  >
                    <Loader2
                      className="w-6 h-6 animate-spin"
                      style={{ color: "oklch(0.72 0.13 218)" }}
                    />
                  </div>
                ) : paymentRequests.length === 0 ? (
                  <div
                    className="text-center py-8"
                    data-ocid="admin.payments.empty_state"
                  >
                    <p
                      className="text-base"
                      style={{ color: "oklch(0.73 0.03 235)" }}
                    >
                      Keine Zahlungsanfragen vorhanden.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentRequests.map((req, i) => (
                      <div
                        key={`${req.nickname}-${i}`}
                        className="p-5 rounded-xl"
                        style={{
                          background: "oklch(0.13 0.025 248)",
                          border: "1px solid oklch(0.27 0.055 248)",
                        }}
                        data-ocid={`admin.payment.item.${i + 1}` as string}
                      >
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="space-y-1">
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
                              W\u00e4hrung: <strong>{req.currency}</strong>
                            </p>
                            <p
                              className="text-sm font-mono"
                              style={{ color: "oklch(0.73 0.03 235)" }}
                            >
                              TX:{" "}
                              {req.txHash.length > 20
                                ? `${req.txHash.slice(0, 20)}\u2026`
                                : req.txHash}
                            </p>
                            <StatusBadge status={req.status} />
                          </div>
                          {req.status === "pending" && (
                            <div className="flex items-center gap-2">
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
                                data-ocid={
                                  `admin.approve_button.${i + 1}` as string
                                }
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
                                  border: "1px solid oklch(0.62 0.22 25 / 0.3)",
                                }}
                                data-ocid={
                                  `admin.reject_button.${i + 1}` as string
                                }
                              >
                                <XCircle className="w-4 h-4" /> Ablehnen
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
