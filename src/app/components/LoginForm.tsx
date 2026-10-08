"use client";

import { useState, type FormEvent } from "react";
import styles from "./RegistrationForm.module.css";

export type LoginCredentials = {
  email: string;
  password: string;
};

type LoginFormProps = {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
};

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");
    try {
      await onLogin({ email: email.trim(), password });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        Email
        <input
          autoComplete="username"
          disabled={isSubmitting}
          onChange={(event) => setEmail(event.currentTarget.value)}
          required
          type="email"
          value={email}
        />
      </label>
      <label className={styles.field}>
        Password
        <input
          autoComplete="current-password"
          disabled={isSubmitting}
          onChange={(event) => setPassword(event.currentTarget.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {submitError && (
        <p className={styles.errorMessage} role="alert">
          {submitError}
        </p>
      )}
      <button className={styles.submit} disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}