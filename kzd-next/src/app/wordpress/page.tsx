import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon/ComingSoon";

/* Parked while it is rebuilt: the previous page is in git history. */
export const metadata: Metadata = {
  title: "WordPress hosting | Coming soon",
  description: "WordPress hosting at KZD Solutions is coming soon.",
  alternates: { canonical: "/wordpress" },
};

export default function Page() {
  return <ComingSoon section="WordPress hosting" />;
}
