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

function AuthFieldError({ children }) {
  return children ? <p className="field-error">{children}</p> : null;
}

function SignupContent() {
  const { session, signUp } = useAuth();
  const [form, setForm] = useState({ displayName: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) window.location.replace("/");
  }, [session]);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.displayName.trim()) nextErrors.displayName = "Display name is required.";
    if (!form.email.includes("@")) nextErrors.email = "Enter a valid email address.";
    if (form.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirm) nextErrors.confirm = "Passwords do not match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await signUp(form.email.trim(), form.password, form.displayName.trim());
      window.location.replace("/");
    } catch (err) {
      setErrors({ form: err.message || "Unable to create account." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <form className="auth-panel" onSubmit={submit}>
        <div className="app-mark" aria-hidden="true">H</div>
        <p className="eyebrow">Create account</p>
        <h1>Join your halaqa.</h1>
        <input value={form.displayName} onChange={(event) => setField("displayName", event.target.value)} placeholder="Display name" />
        <AuthFieldError>{errors.displayName}</AuthFieldError>
        <input value={form.email} onChange={(event) => setField("email", event.target.value)} placeholder="Email address" />
        <AuthFieldError>{errors.email}</AuthFieldError>
        <div className="password-row">
          <input value={form.password} onChange={(event) => setField("password", event.target.value)} type={showPassword ? "text" : "password"} placeholder="Password" />
          <button className="pressable" type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button>
        </div>
        <AuthFieldError>{errors.password}</AuthFieldError>
        <input value={form.confirm} onChange={(event) => setField("confirm", event.target.value)} type={showPassword ? "text" : "password"} placeholder="Confirm password" />
        <AuthFieldError>{errors.confirm}</AuthFieldError>
        <AuthFieldError>{errors.form}</AuthFieldError>
        <Button disabled={submitting}>{submitting ? "Creating account" : "Create Account"}</Button>
        <p className="auth-legal">
          Already have an account? <Link href="/login">Log in</Link>.
        </p>
      </form>
    </main>
  );
}

export default function SignupClient() {
  return (
    <AuthProvider>
      <SignupContent />
    </AuthProvider>
  );
}

