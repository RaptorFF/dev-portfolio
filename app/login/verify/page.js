"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function Verify() {
  const params = useSearchParams();
  const email = params.get("email");
  const token = params.get("token");
  const [failed, setFailed] = useState(!email || !token);
  const started = useRef(false);

  // Token se troši tek ovde (u browseru), da ga email skeneri ne bi potrošili otvaranjem linka.
  useEffect(() => {
    if (!email || !token || started.current) return;
    started.current = true;

    signIn("magic-link", { email, token, redirect: false }).then((result) => {
      if (result?.ok && !result.error) {
        window.location.assign("/dashboard");
      } else {
        setFailed(true);
      }
    });
  }, [email, token]);

  return failed ? (
    <p className="save-status" role="alert">
      Link je istekao ili je već iskorišćen.{" "}
      <Link href="/login">Zatraži novi</Link>
    </p>
  ) : (
    <p role="status">Prijavljivanje...</p>
  );
}

export default function VerifyPage() {
  return (
    <main className="preview-page-shell">
      <section className="preview-page-card">
        <Suspense>
          <Verify />
        </Suspense>
      </section>
    </main>
  );
}
