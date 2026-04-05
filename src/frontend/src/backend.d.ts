import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> { __kind__: "Some"; value: T; }
export interface None { __kind__: "None"; }
export type Option<T> = Some<T> | None;
export interface UserProfile { name: string; }
export enum UserRole { admin = "admin", user = "user", guest = "guest" }
export interface CryptoAddress { currency: string; address: string; amount: string; }
export interface PaymentRequest { nickname: string; currency: string; txHash: string; status: string; submittedAt: bigint; }
// PdfEntry now uses base64Data instead of hash (no external storage canister)
export interface PdfEntry { id: string; blockId: string; filename: string; base64Data: string; uploadedAt: bigint; }
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllProfiles(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentUser(sessionToken: string): Promise<{ __kind__: "ok"; ok: string; } | { __kind__: "error"; error: string; }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVisitorCount(adminPasswordAttempt: string): Promise<{ __kind__: "ok"; ok: bigint; } | { __kind__: "error"; error: string; }>;
    incrementVisitorCount(): Promise<void>;
    recordHeartbeat(sessionToken: string): Promise<void>;
    getActiveVisitorCount(adminPasswordAttempt: string): Promise<{ __kind__: "ok"; ok: bigint; } | { __kind__: "error"; error: string; }>;
    getMusterschreibenCount(adminPasswordAttempt: string): Promise<{ __kind__: "ok"; ok: bigint; } | { __kind__: "error"; error: string; }>;
    isCallerAdmin(): Promise<boolean>;
    isRegistered(): Promise<boolean>;
    login(nickname: string, passwordHash: string): Promise<{ __kind__: "ok"; ok: string; } | { __kind__: "error"; error: string; }>;
    register(nickname: string, passwordHash: string): Promise<{ __kind__: "ok"; ok: null; } | { __kind__: "error"; error: string; }>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setCryptoAddress(adminPw: string, currency: string, address: string, amount: string): Promise<{ __kind__: "ok"; ok: null; } | { __kind__: "error"; error: string; }>;
    getCryptoAddresses(): Promise<Array<CryptoAddress>>;
    submitPaymentProof(nickname: string, currency: string, txHash: string): Promise<{ __kind__: "ok"; ok: null; } | { __kind__: "error"; error: string; }>;
    getMyPaymentStatus(nickname: string): Promise<PaymentRequest | null>;
    getAllPaymentRequests(adminPw: string): Promise<{ __kind__: "ok"; ok: Array<PaymentRequest>; } | { __kind__: "error"; error: string; }>;
    approvePayment(adminPw: string, nickname: string): Promise<{ __kind__: "ok"; ok: null; } | { __kind__: "error"; error: string; }>;
    rejectPayment(adminPw: string, nickname: string): Promise<{ __kind__: "ok"; ok: null; } | { __kind__: "error"; error: string; }>;
    hasMusterschreibenAccess(nickname: string): Promise<boolean>;
    grantMusterschreibenAccess(adminPw: string, nickname: string): Promise<{ __kind__: "ok"; ok: null; } | { __kind__: "error"; error: string; }>;
    revokeMusterschreibenAccess(adminPw: string, nickname: string): Promise<{ __kind__: "ok"; ok: null; } | { __kind__: "error"; error: string; }>;
    verifyBTCTransaction(txHash: string, nickname: string): Promise<{ __kind__: "confirmed"; } | { __kind__: "pending"; } | { __kind__: "error"; error: string; }>;
    // PDF management - stores base64 data directly (no external storage canister)
    addPdfEntry(adminPw: string, blockId: string, filename: string, base64Data: string): Promise<{ __kind__: "ok"; ok: string; } | { __kind__: "error"; error: string; }>;
    deletePdfEntry(adminPw: string, entryId: string): Promise<{ __kind__: "ok"; ok: null; } | { __kind__: "error"; error: string; }>;
    getPdfEntriesByBlock(blockId: string): Promise<Array<PdfEntry>>;
    getAllPdfEntries(adminPw: string): Promise<{ __kind__: "ok"; ok: Array<PdfEntry>; } | { __kind__: "error"; error: string; }>;
}
