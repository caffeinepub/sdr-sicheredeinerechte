// Stub: Internet Identity is not used in this project.
// This file is kept to prevent import errors from any leftover references.
import { type ReactNode, createElement } from "react";

export type Status = "idle";

export type InternetIdentityContext = {
  identity: undefined;
  login: () => void;
  clear: () => void;
  loginStatus: Status;
  isInitializing: false;
  isLoginIdle: true;
  isLoggingIn: false;
  isLoginSuccess: false;
  isLoginError: false;
  loginError: undefined;
};

const noop = () => {};

export const useInternetIdentity = (): InternetIdentityContext => ({
  identity: undefined,
  login: noop,
  clear: noop,
  loginStatus: "idle",
  isInitializing: false,
  isLoginIdle: true,
  isLoggingIn: false,
  isLoginSuccess: false,
  isLoginError: false,
  loginError: undefined,
});

export function InternetIdentityProvider({
  children,
}: {
  children: ReactNode;
}) {
  return createElement("div", { style: { display: "contents" } }, children);
}
