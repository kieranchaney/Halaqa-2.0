import type { ReactNode } from "react";

export type HalaqaUser = {
  id: string;
  email?: string;
  display_name?: string;
  profile?: Record<string, unknown> | null;
  [key: string]: unknown;
};

export type AuthContextValue = {
  user: HalaqaUser | null;
  session: unknown;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<unknown>;
  signIn: (email: string, password: string) => Promise<unknown>;
  signOut: () => Promise<void>;
};

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element;
export function useAuth(): AuthContextValue;
