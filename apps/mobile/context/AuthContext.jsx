"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

async function loadProfile(session) {
  if (!session?.user) return null;
  const fallbackName =
    session.user.user_metadata?.display_name ||
    session.user.email?.split("@")[0] ||
    "Member";

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  let profile = data;
  if (!profile) {
    const { data: created } = await supabase
      .from("users")
      .upsert({
        id: session.user.id,
        display_name: fallbackName,
        avatar_url: session.user.user_metadata?.avatar_url || null
      })
      .select("*")
      .maybeSingle();
    profile = created;
  }

  return {
    ...session.user,
    display_name: profile?.display_name || fallbackName,
    profile
  };
}

async function signUp(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } }
  });
  if (error) throw error;

  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error("An account with this email already exists. Please log in instead.");
  }

  if (data.user && data.session) {
    const { error: profileError } = await supabase
      .from("users")
      .upsert({
        id: data.user.id,
        display_name: displayName,
        avatar_url: data.user.user_metadata?.avatar_url || null
      });
    if (profileError) throw profileError;
  }

  if (!data.session) {
    const signedIn = await signIn(email, password);
    return signedIn;
  }

  return data;
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
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
    () => ({ user, session, loading, signUp, signIn, signOut }),
    [loading, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
