import type { Identity } from "@icp-sdk/core/agent";
// Stub: Internet Identity is not used in this project.
// This file is kept to prevent import errors if referenced elsewhere.
import type { ReactNode } from "react";

export type Status =
  | "initializing"
  | "idle"
  | "logging-in"
  | "success"
  | "loginError";

export type InternetIdentityContext = {
  identity?: Identity;
  login: () => void;
  clear: () => void;
  loginStatus: Status;
  isInitializing: boolean;
  isLoginIdle: boolean;
  isLoggingIn: boolean;
  isLoginSuccess: boolean;
  isLoginError: boolean;
  loginError?: Error;
};

export function useInternetIdentity(): InternetIdentityContext {
  return {
    identity: undefined,
    login: () => {},
    clear: () => {},
    loginStatus: "idle",
    isInitializing: false,
    isLoginIdle: true,
    isLoggingIn: false,
    isLoginSuccess: false,
    isLoginError: false,
    loginError: undefined,
  };
}

export function InternetIdentityProvider({
  children,
}: { children: ReactNode }) {
  return children as React.ReactElement;
}
