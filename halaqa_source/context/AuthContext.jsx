"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getSession,
  onAuthStateChange,
  signIn as signInWithSupabase,
  signOut as signOutWithSupabase,
  signUp as signUpWithSupabase
} from "../lib/auth";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

async function loadProfile(session) {
  if (!session?.user) return null;
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  return {
    ...session.user,
    display_name:
      data?.display_name ||
      session.user.user_metadata?.display_name ||
      session.user.email?.split("@")[0] ||
      "Member",
    profile: data
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function boot() {
      try {
        const currentSession = await getSession();
        if (!active) return;
        setSession(currentSession);
        setUser(await loadProfile(currentSession));
      } finally {
        if (active) setLoading(false);
      }
    }

    boot();
    const { data } = onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(await loadProfile(nextSession));
      setLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signUp: signUpWithSupabase,
      signIn: signInWithSupabase,
      signOut: signOutWithSupabase
    }),
    [loading, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
