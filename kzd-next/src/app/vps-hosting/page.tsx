import type { Metadata } from "next";
import ComingSoonProduct from "@/components/ComingSoonProduct/ComingSoonProduct";

const DESCRIPTION =
  "Dedicated virtual server hosting from KZD Solutions — in active development.";

export const metadata: Metadata = {
  title: "VPS Hosting",
  description: DESCRIPTION,
  alternates: { canonical: "/vps-hosting" },
  openGraph: {
    type: "website",
    url: "/vps-hosting",
    title: "VPS Hosting | KZD Solutions",
    description: DESCRIPTION,
    siteName: "KZD Solutions",
  },
};

export default function VpsHostingPage() {
  return (
    <ComingSoonProduct
      eyebrow="VPS Hosting"
      title="VPS Hosting"
      heroImage="/images/vps.jpeg"
      heroAlt=""
      bodyTitle="VPS Hosting Is On Its Way"
      body="We're building dedicated virtual server infrastructure with the reliability, scalability, and security you expect from KZD Solutions. It isn't ready to launch just yet, but it's actively in development."
    />
  );
}
