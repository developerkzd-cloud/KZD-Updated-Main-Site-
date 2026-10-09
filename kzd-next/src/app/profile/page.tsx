/* ==========================================================================
   /profile — the applicant profile / job-application dashboard.

   Thin Server Component shell, only here to carry the route's metadata. The
   page itself is inherently client-state-driven (it reads localStorage on
   mount and has no data a server render could use), so everything else
   lives in the single "use client" boundary, ProfileApp.

   Ported from profile.html + js/kzd-profile.js as a client-only prototype —
   see the header comment in src/lib/kzdStore.ts for what that does and does
   not mean for real applicant data.
   ========================================================================== */

import type { Metadata } from "next";
import ProfileApp from "./ProfileApp";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your KZD Solutions applicant profile and track your job applications.",
  alternates: { canonical: "/profile" },
  // The legacy page had no such directive, but this is a private account
  // page with nothing to show a signed-out crawler — a deliberate
  // improvement over the static site rather than a straight port.
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileApp />;
}
