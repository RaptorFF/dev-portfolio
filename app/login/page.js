"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";

const messages = {
  invalid_email: "Unesi ispravnu email adresu.",
  too_many_requests: "Link je već poslat. Sačekaj minut pa pokušaj ponovo.",
  not_configured: "Prijava nije podešena. Proveri .env.local.",
  send_failed: "Slanje nije uspelo. Pokušaj ponovo.",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function requestLink(event) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(messages[data.error] ?? messages.send_failed);
        setStatus("idle");
        return;
      }

      setStatus("sent");
    } catch {
      setMessage(messages.send_failed);
      setStatus("idle");
    }
  }

  return (
    <main className="preview-page-shell">
      <section className="preview-page-card">
        <h1>Prijava</h1>

        {status === "sent" ? (
          <p className="save-status" role="status">
            Poslali smo link za prijavu na {email}. Važi 15 minuta.
          </p>
        ) : (
          <form onSubmit={requestLink}>
            <div className="mock-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="e.g. hello@example.com"
              />
            </div>
            {message ? <p className="save-status">{message}</p> : null}
            <button
              type="submit"
              className="button button-primary"
              disabled={status === "sending"}
            >
              {status === "sending" ? "Slanje..." : "Pošalji link za prijavu"}
            </button>
          </form>
        )}

        <p>
          <button
            type="button"
            className="text-button"
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          >
            Ili nastavi sa GitHub-om
          </button>{" "}
          · <Link href="/">Početna</Link>
        </p>
      </section>
    </main>
  );
}
