import { Actor, HttpAgent } from "@icp-sdk/core/agent";
import type {
  PaymentRequest,
  PdfEntry,
  TxCheckResult,
  backendInterface,
} from "./backend.d";
import { createActorWithConfig } from "./config";
import { idlFactory } from "./declarations/backend.did";
import type {
  PaymentRequestRecord,
  _SERVICE,
} from "./declarations/backend.did.d.ts";

// Raw actor cache (uses raw Candid types from IDL)
let rawActorInstance:
  | import("@icp-sdk/core/agent").ActorSubclass<_SERVICE>
  | null = null;
// Wrapper actor cache (Backend class with __kind__ conversions for legacy methods)
let wrapperActorInstance: backendInterface | null = null;

async function getRawActor(): Promise<
  import("@icp-sdk/core/agent").ActorSubclass<_SERVICE>
> {
  if (rawActorInstance) return rawActorInstance;
  const { loadConfig } = await import("./config");
  const config = await loadConfig();
  const agent = new HttpAgent({ host: config.backend_host });
  // Always fetch root key - works on localhost and ICP staging/draft environments
  await agent.fetchRootKey().catch(() => {});
  rawActorInstance = Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId: config.backend_canister_id,
  });
  return rawActorInstance;
}

async function getWrapperActor(): Promise<backendInterface> {
  if (!wrapperActorInstance) {
    wrapperActorInstance =
      (await createActorWithConfig()) as unknown as backendInterface;
  }
  return wrapperActorInstance;
}

// Convert Candid optional [] | [T] to T | null
function fromCandidOpt<T>(opt: [] | [T]): T | null {
  return opt.length === 0 ? null : opt[0];
}

// Convert Candid variant { ok: T } | { error: string } to __kind__ tagged union
function fromCandidResult<T>(
  v: { ok: T } | { error: string },
): { __kind__: "ok"; ok: T } | { __kind__: "error"; error: string } {
  if ("ok" in v) return { __kind__: "ok", ok: (v as { ok: T }).ok };
  return { __kind__: "error", error: (v as { error: string }).error };
}

// Convert Candid PaymentRequestRecord to PaymentRequest
function fromCandidPaymentRecord(r: PaymentRequestRecord): PaymentRequest {
  return {
    nickname: r.nickname,
    currency: r.currency,
    txHash: r.txHash,
    status: r.status,
    submittedAt: r.submittedAt,
  };
}

// Convert raw PDF record to PdfEntry (now uses base64Data)
function fromCandidPdfEntry(r: Record<string, unknown>): PdfEntry {
  return {
    id: r.id as string,
    blockId: r.blockId as string,
    filename: r.filename as string,
    base64Data: r.base64Data as string,
    uploadedAt: r.uploadedAt as bigint,
  };
}

// Convert raw TxCheckResult from Candid (optional fields are [] | [T])
function fromCandidTxCheckResult(r: Record<string, unknown>): TxCheckResult {
  const eurAmtOpt = r.eurAmount as [] | [number];
  const errMsgOpt = r.errorMsg as [] | [string];
  return {
    amount: r.amount as string,
    currency: r.currency as string,
    timestamp: r.timestamp as string,
    toAddress: r.toAddress as string,
    addressMatch: r.addressMatch as boolean,
    eurAmount: eurAmtOpt.length > 0 ? (eurAmtOpt[0] as number) : null,
    errorMsg: errMsgOpt.length > 0 ? (errMsgOpt[0] as string) : null,
  };
}

// ALL methods that should use the raw actor directly (no processError wrapper)
const RAW_METHODS = new Set([
  "login",
  "register",
  "recordHeartbeat",
  "getActiveVisitorCount",
  "getMusterschreibenCount",
  "getVisitorCount",
  "incrementVisitorCount",
  "setCryptoAddress",
  "getCryptoAddresses",
  "submitPaymentProof",
  "getMyPaymentStatus",
  "getAllPaymentRequests",
  "approvePayment",
  "rejectPayment",
  "hasMusterschreibenAccess",
  "grantMusterschreibenAccess",
  "revokeMusterschreibenAccess",
  "verifyBTCTransaction",
  "checkTransaction",
  "addPdfEntry",
  "deletePdfEntry",
  "getPdfEntriesByBlock",
  "getAllPdfEntries",
]);

export const backend: backendInterface = new Proxy({} as backendInterface, {
  get(_target, prop: string) {
    if (!RAW_METHODS.has(prop)) {
      // Use wrapper actor (Backend class) for other methods
      return (...args: unknown[]) =>
        getWrapperActor().then((actor) =>
          (actor as unknown as Record<string, (...a: unknown[]) => unknown>)[
            prop
          ](...args),
        );
    }

    // Use raw actor for all critical methods - no processError, no thrown exceptions
    return (...args: unknown[]) =>
      getRawActor().then(async (actor) => {
        const fn = (
          actor as unknown as Record<string, (...a: unknown[]) => unknown>
        )[prop];
        if (typeof fn !== "function") {
          throw new Error(`Method ${prop} not found on actor`);
        }
        const result = await fn(...args);

        switch (prop) {
          // Auth methods: return with __kind__ so AuthModal checks work
          case "login":
          case "register":
            return fromCandidResult(
              result as { ok: unknown } | { error: string },
            );

          case "recordHeartbeat":
          case "incrementVisitorCount":
            return result;

          case "getActiveVisitorCount":
          case "getMusterschreibenCount":
          case "getVisitorCount":
          case "approvePayment":
          case "rejectPayment":
          case "grantMusterschreibenAccess":
          case "revokeMusterschreibenAccess":
          case "setCryptoAddress":
          case "submitPaymentProof":
            return fromCandidResult(
              result as { ok: unknown } | { error: string },
            );

          case "getMyPaymentStatus": {
            const opt = result as [] | [PaymentRequestRecord];
            const rec = fromCandidOpt(opt);
            return rec ? fromCandidPaymentRecord(rec) : null;
          }

          case "getAllPaymentRequests": {
            const r = result as
              | { ok: PaymentRequestRecord[] }
              | { error: string };
            if ("ok" in r) {
              return { __kind__: "ok", ok: r.ok.map(fromCandidPaymentRecord) };
            }
            return { __kind__: "error", error: (r as { error: string }).error };
          }

          case "hasMusterschreibenAccess":
            return result as boolean;

          case "getCryptoAddresses":
            return result;

          case "verifyBTCTransaction": {
            const v = result as
              | { confirmed: null }
              | { pending: null }
              | { error: string };
            if ("confirmed" in v) return { __kind__: "confirmed" };
            if ("pending" in v) return { __kind__: "pending" };
            return { __kind__: "error", error: (v as { error: string }).error };
          }

          case "checkTransaction": {
            const r = result as
              | { ok: Record<string, unknown> }
              | { error: string };
            if ("ok" in r) {
              return {
                __kind__: "ok",
                ok: fromCandidTxCheckResult(r.ok),
              };
            }
            return { __kind__: "error", error: (r as { error: string }).error };
          }

          case "addPdfEntry":
          case "deletePdfEntry":
            return fromCandidResult(
              result as { ok: unknown } | { error: string },
            );

          case "getAllPdfEntries": {
            const r = result as
              | { ok: Record<string, unknown>[] }
              | { error: string };
            if ("ok" in r) {
              return {
                __kind__: "ok",
                ok: r.ok.map(fromCandidPdfEntry),
              };
            }
            return { __kind__: "error", error: (r as { error: string }).error };
          }

          case "getPdfEntriesByBlock": {
            const arr = result as Record<string, unknown>[];
            return arr.map(fromCandidPdfEntry);
          }

          default:
            return result;
        }
      });
  },
});
