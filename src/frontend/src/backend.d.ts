import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllProfiles(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentUser(sessionToken: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "error";
        error: string;
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVisitorCount(adminPasswordAttempt: string): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "error";
        error: string;
    }>;
    incrementVisitorCount(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isRegistered(): Promise<boolean>;
    login(nickname: string, passwordHash: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "error";
        error: string;
    }>;
    register(nickname: string, passwordHash: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "error";
        error: string;
    }>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
