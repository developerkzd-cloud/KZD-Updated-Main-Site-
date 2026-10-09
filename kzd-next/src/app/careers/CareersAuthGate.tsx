"use client";

/* ==========================================================================
   Wires AuthModal into /careers — the "use client" leaf that page.tsx (a
   Server Component) renders. Ported from js/kzd-auth.js's openFromQuery():

     /careers?signin=1&next=/profile

   /profile redirects here when there is no session (see ProfileApp.tsx). On
   mount, if the URL says ?signin=1 and there is no session yet, the modal
   opens itself in sign-in mode. `next` is followed only if it passes
   safeNext() below, so the parameter cannot bounce someone to another site
   right after they sign in.

   Also renders the page's own "Sign in" trigger — the legacy site only ever
   reached this modal from a nav link or a ?signin=1 URL; this app's nav is a
   different, unrelated (FOSSBilling) login, so /careers needs its own way in.
   ========================================================================== */

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthModal, { type AuthMode } from "@/components/AuthModal/AuthModal";
import { getSession } from "@/lib/kzdStore";
import styles from "./careers.module.css";

/** Only a same-origin relative path shaped like this app's routes: a leading
    "/", no scheme, no protocol-relative "//", and no ".." segment anywhere in
    the path. Adapted from js/kzd-auth.js's safeNext(), which required a
    literal ".html" suffix — this app's routes (/profile, /careers/...) are
    extensionless, so that suffix check is replaced with a leading-slash
    check instead. */
function safeNext(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(next)) return null;
  const pathPart = next.split(/[?#]/)[0];
  if (pathPart.split("/").includes("..")) return null;
  return next;
}

export default function CareersAuthGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  // This component only ever renders on the client (useSearchParams forces
  // that above its nearest Suspense boundary, same as ProfileApp's
  // localStorage reads), so it is safe to read the session directly in the
  // lazy initializer instead of opening the modal from an effect. Whatever
  // the URL said when this component first mounted is what decides whether
  // it auto-opens — a later change to the query string does not reopen it.
  const [open, setOpen] = useState(() => searchParams.get("signin") === "1" && !getSession());
  const [mode, setMode] = useState<AuthMode>("signin");

  const handleDone = useCallback(() => {
    setOpen(false);
    if (next) router.replace(next);
  }, [next, router]);

  return (
    <>
      <button
        type="button"
        className={styles.signInTrigger}
        onClick={() => {
          setMode("signin");
          setOpen(true);
        }}
      >
        Sign in to apply
      </button>
      {open && (
        <AuthModal
          mode={mode}
          onDone={handleDone}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
