import {
  Activity,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  LogOut,
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

      // Load musterschreiben count
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base font-semibold transition-all"
              style={{
                background: "oklch(0.55 0.22 25 / 0.15)",
                color: "oklch(0.75 0.22 25)",
                border: "1px solid oklch(0.62 0.22 25 / 0.4)",
              }}
              data-ocid="admin.logout.button"
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Visitor counts + Musterschreiben count - 3-column grid */}
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
                  <div
                    className="flex justify-center"
                    data-ocid="admin.musterschreiben_count.loading_state"
                  >
                    <Loader2
                      className="w-8 h-8 animate-spin"
                      style={{ color: "oklch(0.75 0.16 55)" }}
                    />
                  </div>
                ) : (
                  <p
                    className="font-bold text-4xl"
                    style={{ color: "oklch(0.75 0.16 55)" }}
                    data-ocid="admin.musterschreiben_count.success_state"
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
                  data-ocid="admin.musterschreiben_count.button"
                >
                  Aktualisieren
                </button>
              </div>
            </div>

            {/* Payment requests */}
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
                className="w-full flex items-center justify-between px-8 py-5 transition-all"
                style={{
                  background: "oklch(0.17 0.03 248)",
                  color: "oklch(0.96 0.015 230)",
                }}
                data-ocid="admin.payments.toggle"
              >
                <span className="font-bold text-xl">Zahlungseingänge</span>
                {showPayments ? (
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
                                  data-ocid={
                                    `admin.copy_tx.button.${i + 1}` as string
                                  }
                                >
                                  <Copy className="w-3 h-3" />
                                  {copiedTx === `${req.nickname}-${i}`
                                    ? "Kopiert ✓"
                                    : "Kopieren"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleGrantAccess(req.nickname)
                                  }
                                  className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                                  style={{
                                    background: "oklch(0.50 0.15 145 / 0.15)",
                                    color: "oklch(0.50 0.15 145)",
                                    border:
                                      "1px solid oklch(0.50 0.15 145 / 0.3)",
                                  }}
                                  data-ocid={
                                    `admin.grant_access.button.${i + 1}` as string
                                  }
                                >
                                  <CheckCircle className="w-3 h-3" />{" "}
                                  Musterschreiben freischalten
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
                                    data-ocid={
                                      `admin.approve_button.${i + 1}` as string
                                    }
                                  >
                                    <CheckCircle className="w-4 h-4" />{" "}
                                    Genehmigen
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
                                    data-ocid={
                                      `admin.reject_button.${i + 1}` as string
                                    }
                                  >
                                    <XCircle className="w-4 h-4" /> Ablehnen
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
