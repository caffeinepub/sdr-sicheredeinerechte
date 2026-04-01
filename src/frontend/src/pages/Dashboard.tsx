import { CheckCircle, Clock, Loader2, LogOut, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { backend } from "../backendActor";
import { clearSession, getSession } from "../utils/auth";

export default function Dashboard() {
  const [nickname, setNickname] = useState("");
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      window.location.href = "/";
      return;
    }
    setNickname(session.nickname);
    setChecking(false);
    Promise.all([
      backend.hasMusterschreibenAccess(session.nickname),
      backend.getMyPaymentStatus(session.nickname),
    ])
      .then(([access, status]) => {
        setHasAccess(access);
        setPaymentPending(!!status && status.status === "pending");
        setLoadingStatus(false);
      })
      .catch(() => setLoadingStatus(false));
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
        data-ocid="dashboard.loading_state"
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ background: "oklch(0.72 0.13 218 / 0.2)" }}
          >
            <Shield
              className="w-6 h-6"
              style={{ color: "oklch(0.72 0.13 218)" }}
            />
          </div>
          <p className="text-base" style={{ color: "oklch(0.73 0.03 235)" }}>
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
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
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
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all"
            style={{
              color: "oklch(0.73 0.03 235)",
              border: "1px solid oklch(0.27 0.055 248)",
            }}
            data-ocid="dashboard.logout.button"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome row with Zugang button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1
              className="font-bold text-3xl sm:text-4xl mb-2"
              style={{ color: "oklch(0.96 0.015 230)" }}
            >
              Willkommen,{" "}
              <span style={{ color: "oklch(0.72 0.13 218)" }}>{nickname}</span>!
            </h1>
            <p className="text-base" style={{ color: "oklch(0.73 0.03 235)" }}>
              Ihr persönlicher Bereich bei SichereDeineRechte.
            </p>
          </div>

          {/* Zugang button */}
          {loadingStatus ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-base font-semibold cursor-not-allowed"
              style={{
                background: "oklch(0.28 0.01 248)",
                color: "oklch(0.55 0.02 248)",
                border: "1px solid oklch(0.35 0.01 248)",
              }}
              data-ocid="dashboard.zugang.loading_state"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Zugang zu den Musterschreiben
            </button>
          ) : hasAccess ? (
            <button
              type="button"
              onClick={() => {
                window.location.href = "/musterschreiben";
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-base font-semibold transition-all"
              style={{
                background: "oklch(0.50 0.15 145)",
                color: "#fff",
              }}
              data-ocid="dashboard.zugang.button"
            >
              <CheckCircle className="w-4 h-4" />
              Zugang zu den Musterschreiben freigeschaltet
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-base font-semibold cursor-not-allowed"
              style={{
                background: "oklch(0.28 0.01 248)",
                color: "oklch(0.55 0.02 248)",
                border: "1px solid oklch(0.35 0.01 248)",
              }}
              data-ocid="dashboard.zugang.button"
            >
              Zugang zu den Musterschreiben
            </button>
          )}
        </motion.div>

        {/* Musterschreiben Section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-8 rounded-2xl mb-6"
          style={{
            background: "oklch(0.17 0.03 248)",
            border: "1px solid oklch(0.27 0.055 248)",
          }}
          data-ocid="dashboard.musterschreiben.panel"
        >
          {loadingStatus ? (
            <div className="flex items-center gap-3">
              <Loader2
                className="w-5 h-5 animate-spin"
                style={{ color: "oklch(0.72 0.13 218)" }}
              />
              <p
                className="text-base"
                style={{ color: "oklch(0.73 0.03 235)" }}
              >
                Status wird geladen…
              </p>
            </div>
          ) : hasAccess ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle
                  className="w-7 h-7"
                  style={{ color: "oklch(0.55 0.15 145)" }}
                />
                <span
                  className="px-3 py-1.5 rounded-full text-base font-semibold"
                  style={{
                    background: "oklch(0.55 0.15 145 / 0.15)",
                    color: "oklch(0.55 0.15 145)",
                    border: "1px solid oklch(0.55 0.15 145 / 0.3)",
                  }}
                >
                  ✓ Musterschreiben freigeschaltet
                </span>
              </div>
              <p
                className="text-base mb-5"
                style={{ color: "oklch(0.73 0.03 235)" }}
              >
                Ihr Zugang ist aktiv. Sie können jetzt alle Musterschreiben
                einsehen und herunterladen.
              </p>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/musterschreiben";
                }}
                className="px-6 py-3 rounded-xl text-lg font-bold transition-all"
                style={{ background: "oklch(0.55 0.15 145)", color: "#fff" }}
                data-ocid="dashboard.open_musterschreiben.button"
              >
                Musterschreiben öffnen →
              </button>
            </div>
          ) : paymentPending ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Clock
                  className="w-6 h-6"
                  style={{ color: "oklch(0.72 0.13 218)" }}
                />
                <h2
                  className="font-bold text-xl"
                  style={{ color: "oklch(0.96 0.015 230)" }}
                >
                  Ausgleich wird überprüft…
                </h2>
              </div>
              <p
                className="text-base mb-4"
                style={{ color: "oklch(0.73 0.03 235)" }}
              >
                Ihr Ausgleich wurde eingereicht und wird gerade geprüft. Sie
                erhalten Zugang sobald die Bestätigung vorliegt.
              </p>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/zahlung";
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-base font-medium transition-all"
                style={{
                  color: "oklch(0.72 0.13 218)",
                  border: "1px solid oklch(0.72 0.13 218 / 0.35)",
                }}
                data-ocid="dashboard.check_payment.button"
              >
                Zahlungsstatus prüfen →
              </button>
            </div>
          ) : (
            <div>
              <h2
                className="font-bold text-2xl mb-3"
                style={{ color: "oklch(0.96 0.015 230)" }}
              >
                Musterschreiben / administrative Prozesse freischalten
              </h2>
              <p
                className="text-base leading-relaxed mb-2"
                style={{ color: "oklch(0.73 0.03 235)" }}
              >
                Erhalten Sie Zugang zu professionellen Musterschreiben und
                administrativen Prozessen für den Umgang mit sogenannten
                Behörden, Ämtern oder Gerichten. Unsere Vorlagen helfen Ihnen,
                Ihre Rechte zu wahren.
              </p>
              <ul
                className="text-base mb-5 space-y-2"
                style={{ color: "oklch(0.73 0.03 235)" }}
              >
                <li>
                  ✓ Zurückweisung von mangelhaften Behörden-, Amts- oder
                  Gerichtsschreiben (sogenannte Beschlüsse, Bescheide, Urteile,
                  Zahlungsaufforderungen etc.)
                </li>
                <li>
                  ✓ Annahme von behördlichen, amtlichen oder gerichtlichen
                  Forderung (sogenannte Bußgelder, Steuern etc.) unter Vorbehalt
                  der Rechtmäßigkeit.
                </li>
                <li>
                  ✓ Annahme von behördlichen, amtlichen oder gerichtlichen
                  Forderung (sogenannte Bußgelder, Steuern etc.) unter Vorbehalt
                  der Rechtmäßigkeit in Verbindung mit einem Gegenangebot.
                </li>
              </ul>
              <p
                className="text-sm mb-5"
                style={{ color: "oklch(0.55 0.02 235)" }}
              >
                Bezahlung sicher per Kryptowährung (ICP, BTC, ETH, XRP, SOL).
              </p>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/zahlung";
                }}
                className="px-6 py-3 rounded-xl text-lg font-bold transition-all"
                style={{ background: "oklch(0.62 0.22 25)", color: "#fff" }}
                data-ocid="dashboard.buy_musterschreiben.button"
              >
                Jetzt Zugang zu professionellen Musterschreiben freischalten →
              </button>
            </div>
          )}
        </motion.div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-8 rounded-2xl text-center"
          style={{
            background: "oklch(0.17 0.03 248 / 0.5)",
            border: "1px solid oklch(0.27 0.055 248)",
          }}
          data-ocid="dashboard.quote.panel"
        >
          <blockquote
            className="font-bold text-2xl sm:text-3xl lg:text-4xl leading-relaxed mb-4"
            style={{ color: "oklch(0.72 0.13 218)" }}
          >
            „Fast alle Rechte beruhen auf Rechtsbrüchen, besonders in der
            Politik."
          </blockquote>
          <p className="text-base" style={{ color: "oklch(0.73 0.03 235)" }}>
            — Ernst Julius Hähnel
          </p>
        </motion.div>
      </main>

      <footer
        className="py-8 px-6 mt-12"
        style={{ borderTop: "1px solid oklch(0.27 0.055 248)" }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm" style={{ color: "oklch(0.55 0.02 235)" }}>
            © {new Date().getFullYear()} SichereDeineRechte. Alle Rechte
            vorbehalten. Built with love using{" "}
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
