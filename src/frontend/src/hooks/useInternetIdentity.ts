import {
  type ReactNode,
  createContext,
  createElement,
  useContext,
} from "react";

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

const defaultValue: InternetIdentityContext = {
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

const ctx = createContext<InternetIdentityContext>(defaultValue);

export const useInternetIdentity = (): InternetIdentityContext =>
  useContext(ctx);

export function InternetIdentityProvider({
  children,
}: {
  children: ReactNode;
}) {
  return createElement(ctx.Provider, { value: defaultValue }, children);
}
