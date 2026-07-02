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

function friendlySignupError(error) {
  const message = (error?.message || "").toLowerCase();
  if (message.includes("rate limit") || message.includes("too many") || message.includes("email rate limit")) {
    return "Supabase has temporarily paused confirmation emails because too many were requested. Please wait a little while before trying again, or use a different test email.";
  }
  if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
    return "An account already exists for this email. Please use Log In instead, or reset your password if you do not remember it.";
  }
  if (message.includes("confirm")) {
    return "This email needs to be confirmed before it can be used to log in. Please check your inbox for the Supabase confirmation email.";
  }
  return error?.message || "Unable to create account.";
}

function SignupContent() {
  const { session, signUp } = useAuth();
  const [form, setForm] = useState({ displayName: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
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
    setNotice("");
    try {
      const data = await signUp(form.email.trim(), form.password, form.displayName.trim());
      if (data.session) {
        window.location.replace("/");
        return;
      }
      setNotice("Account created. Please check your email and confirm your account before logging in.");
    } catch (err) {
      setErrors({ form: friendlySignupError(err) });
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
        {notice && <p className="inline-status">{notice}</p>}
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
