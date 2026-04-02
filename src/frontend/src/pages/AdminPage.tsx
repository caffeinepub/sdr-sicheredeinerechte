import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Activity,
  CheckCircle,
  Loader2,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { PaymentRequest } from "../backend.d";
import { backend } from "../backendActor";

const ADMIN_PASSWORD = "WotanClan44!";

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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [visitorCount, setVisitorCount] = useState<bigint | null>(null);
  const [visitorLoading, setVisitorLoading] = useState(false);
  const [activeCount, setActiveCount] = useState<bigint | null>(null);
  const [activeLoading, setActiveLoading] = useState(false);

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadActiveCount is stable
  useEffect(() => {
    const storedPw = sessionStorage.getItem("adminPw");
    if (storedPw === ADMIN_PASSWORD) {
      sessionStorage.removeItem("adminPw");
      setIsAuthenticated(true);
      // Load data in background, silently
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

      // Load active visitor count and refresh every 30s
      loadActiveCount();
      const interval = setInterval(loadActiveCount, 30000);
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
          ? backend.setCryptoAddress(
              ADMIN_PASSWORD,
              "BTC",
              btcAddress,
              btcAmount,
            )
          : Promise.resolve(null),
        ethAddress && ethAmount
          ? backend.setCryptoAddress(
              ADMIN_PASSWORD,
              "ETH",
              ethAddress,
              ethAmount,
            )
          : Promise.resolve(null),
        xmrAddress && xmrAmount
          ? backend.setCryptoAddress(
              ADMIN_PASSWORD,
              "XMR",
              xmrAddress,
              xmrAmount,
            )
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
      icon: "₿",
      address: btcAddress,
      setAddress: setBtcAddress,
      amount: btcAmount,
      setAmount: setBtcAmount,
    },
    {
      currency: "ETH",
      icon: "Ξ",
      address: ethAddress,
      setAddress: setEthAddress,
      amount: ethAmount,
      setAmount: setEthAmount,
    },
    {
      currency: "XMR",
      icon: "ɱ",
      address: xmrAddress,
      setAddress: setXmrAddress,
      amount: xmrAmount,
      setAmount: setXmrAmount,
    },
  ];

  const sortedPaymentRequests = [...paymentRequests].sort(
    (a, b) => Number(a.submittedAt) - Number(b.submittedAt),
  );

  if (!isAuthenticated) {
    return null;
  }

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

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Visitor counts - 2-column grid */}
            <div className="mb-8 grid grid-cols-2 gap-4">
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
                  <div
                    className="flex justify-center"
                    data-ocid="admin.visitor_count.loading_state"
                  >
                    <Loader2
                      className="w-8 h-8 animate-spin"
                      style={{ color: "oklch(0.72 0.13 218)" }}
                    />
                  </div>
                ) : (
                  <p
                    className="font-bold text-4xl"
                    style={{ color: "oklch(0.72 0.13 218)" }}
                    data-ocid="admin.visitor_count.success_state"
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
                  <div
                    className="flex justify-center"
                    data-ocid="admin.active_visitors.loading_state"
                  >
                    <Loader2
                      className="w-8 h-8 animate-spin"
                      style={{ color: "oklch(0.55 0.15 145)" }}
                    />
                  </div>
                ) : (
                  <p
                    className="font-bold text-4xl"
                    style={{ color: "oklch(0.55 0.15 145)" }}
                    data-ocid="admin.active_visitors.success_state"
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
                  data-ocid="admin.active_visitors.button"
                >
                  Aktualisieren
                </button>
              </div>
            </div>

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
                Währung ein.
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
                  {savingAddresses ? "Wird gespeichert…" : "Adressen speichern"}
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
                    Ausgleich-Bestätigungen
                  </h2>
                  <p
                    className="text-base"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    Eingegangene Ausgleiche prüfen und Musterschreiben
                    freischalten
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
              ) : sortedPaymentRequests.length === 0 ? (
                <div
                  className="text-center py-8"
                  data-ocid="admin.payments.empty_state"
                >
                  <p
                    className="text-base"
                    style={{ color: "oklch(0.73 0.03 235)" }}
                  >
                    Keine Ausgleich-Bestätigungen vorhanden.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedPaymentRequests.map((req, i) => (
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
                            Kryptowährung: <strong>{req.currency}</strong>
                          </p>
                          <p
                            className="text-sm font-mono break-all"
                            style={{ color: "oklch(0.73 0.03 235)" }}
                          >
                            TX-ID: {req.txHash}
                          </p>
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
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleGrantAccess(req.nickname)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                            style={{
                              background: "oklch(0.50 0.15 145 / 0.15)",
                              color: "oklch(0.50 0.15 145)",
                              border: "1px solid oklch(0.50 0.15 145 / 0.3)",
                            }}
                            data-ocid={
                              `admin.grant_access.button.${i + 1}` as string
                            }
                          >
                            <CheckCircle className="w-4 h-4" /> Musterschreiben
                            freischalten
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
