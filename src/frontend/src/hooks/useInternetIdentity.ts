// InternetIdentityProvider removed to prevent DOM conflicts.
// Stub identity hook so useActor compiles without errors.
export interface IdentityLike {
  getPrincipal: () => { toString: () => string };
}

export function useInternetIdentity(): { identity: IdentityLike | null } {
  return { identity: null };
}
