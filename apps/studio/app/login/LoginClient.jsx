"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "../../context/AuthContext";

function Button({ children, variant = "primary", ...props }) {
  return (
    <button className={`button pressable ${variant}`} {...props}>
      {children}
    </button>
  );
}

function friendlyLoginError(error) {
  const message = error?.message || "Unable to sign in.";
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed")) return "Please confirm your email before logging in.";
  if (lower.includes("invalid login credentials")) return "The email or password does not match an existing confirmed account.";
  if (lower.includes("rate limit") || lower.includes("too many")) return "Too many login attempts. Please wait a little while before trying again.";
  return message;
}

function LoginContent() {
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) window.location.replace("/");
  }, [session]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!email.includes("@") || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      window.location.replace("/");
    } catch (err) {
      setError(friendlyLoginError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <form className="auth-panel" onSubmit={submit}>
        <div className="app-mark" aria-hidden="true">H</div>
        <p className="eyebrow">Welcome back</p>
        <h1>Log in.</h1>
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" />
        {error && <p className="field-error">{error}</p>}
        <Button disabled={submitting}>{submitting ? "Logging in" : "Log In"}</Button>
        <p className="auth-legal">
          New to Halaqa? <Link href="/signup">Create an account</Link>.
        </p>
      </form>
    </main>
  );
}

export default function LoginClient() {
  return (
    <AuthProvider>
      <LoginContent />
    </AuthProvider>
  );
}
