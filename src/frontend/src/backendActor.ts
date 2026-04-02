import { Actor, HttpAgent } from "@icp-sdk/core/agent";
import type { PaymentRequest, backendInterface } from "./backend.d";
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
  // Load config to get canister id and host
  const { loadConfig } = await import("./config");
  const config = await loadConfig();
  const agent = new HttpAgent({ host: config.backend_host });
  if (config.backend_host?.includes("localhost")) {
    await agent.fetchRootKey().catch(() => {});
  }
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
  if ("ok" in v) return { __kind__: "ok", ok: v.ok };
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

// Methods that are NOT in the generated Backend class and need raw actor calls
const RAW_METHODS = new Set([
  "recordHeartbeat",
  "getActiveVisitorCount",
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
]);

export const backend: backendInterface = new Proxy({} as backendInterface, {
  get(_target, prop: string) {
    if (!RAW_METHODS.has(prop)) {
      // Use wrapper actor (Backend class) for legacy methods with __kind__ conversions
      return (...args: unknown[]) =>
        getWrapperActor().then((actor) =>
          (actor as unknown as Record<string, (...a: unknown[]) => unknown>)[
            prop
          ](...args),
        );
    }

    // Use raw actor for new methods, then convert Candid types
    return (...args: unknown[]) =>
      getRawActor().then(async (actor) => {
        const fn = (
          actor as unknown as Record<string, (...a: unknown[]) => unknown>
        )[prop];
        if (typeof fn !== "function") {
          throw new Error(`Method ${prop} not found on actor`);
        }
        const result = await fn(...args);

        // Convert raw Candid responses to the types expected by pages
        switch (prop) {
          case "recordHeartbeat":
            return result;

          case "getActiveVisitorCount":
          case "approvePayment":
          case "rejectPayment":
          case "grantMusterschreibenAccess":
          case "revokeMusterschreibenAccess":
          case "setCryptoAddress":
            return fromCandidResult(
              result as { ok: unknown } | { error: string },
            );

          case "submitPaymentProof":
            return fromCandidResult(result as { ok: null } | { error: string });

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

          default:
            return result;
        }
      });
  },
});
