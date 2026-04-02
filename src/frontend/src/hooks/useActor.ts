// Stub – useActor wird nicht mehr verwendet.
// Die App nutzt backendActor.ts direkt.
import type { backendInterface } from "../backend";

export function useActor(): {
  actor: backendInterface | null;
  isFetching: boolean;
} {
  return { actor: null, isFetching: false };
}
