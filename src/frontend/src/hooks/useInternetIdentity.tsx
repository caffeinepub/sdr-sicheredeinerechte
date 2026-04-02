import { type ReactNode, createContext, useContext } from "react";

export type Status =
  | "initializing"
  | "idle"
  | "logging-in"
  | "success"
  | "loginError";

export type InternetIdentityContext = {
  identity?: undefined;
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

const ctx = createContext<InternetIdentityContext>({
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
});

export const useInternetIdentity = (): InternetIdentityContext =>
  useContext(ctx);

export function InternetIdentityProvider({
  children,
}: { children: ReactNode }) {
  return <>{children}</>;
}
