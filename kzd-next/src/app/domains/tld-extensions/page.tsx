import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon/ComingSoon";

/* Parked while it is rebuilt: the previous page is in git history. */
export const metadata: Metadata = {
  title: "Domain extensions | Coming soon",
  description: "Domain extensions at KZD Solutions is coming soon.",
  robots: { index: false },
};

export default function Page() {
  return <ComingSoon section="Domain extensions" />;
}
