import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon/ComingSoon";

/* Parked while it is rebuilt: the previous page is in git history. */
export const metadata: Metadata = {
  title: "VPS hosting | Coming soon",
  description: "VPS hosting at KZD Solutions is coming soon.",
  alternates: { canonical: "/vps-hosting" },
};

export default function Page() {
  return <ComingSoon section="VPS hosting" />;
}
