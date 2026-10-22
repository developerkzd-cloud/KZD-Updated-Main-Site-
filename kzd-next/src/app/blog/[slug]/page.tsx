import type { Metadata } from "next";
import ServiceComingSoon from "@/components/ServiceComingSoon/ServiceComingSoon";
import { COMING_SOON } from "@/lib/comingSoon";

/* Parked while it is rebuilt: the previous page is in git history. Every
   /blog/<slug> renders the same placeholder, so all of them point their
   canonical at /blog rather than appearing as duplicate pages. Uses the
   same black coming-soon page as the parked services. */
export const metadata: Metadata = {
  title: "Blog | Coming soon",
  description: "Blog at KZD Solutions is coming soon.",
  alternates: { canonical: "/blog" },
};

export default function Page() {
  return <ServiceComingSoon page={COMING_SOON.blog} />;
}
