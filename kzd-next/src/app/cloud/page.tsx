import type { Metadata } from "next";
import ComingSoonProduct from "@/components/ComingSoonProduct/ComingSoonProduct";

const DESCRIPTION =
  "Enterprise-grade cloud hosting infrastructure from KZD Solutions — in active development.";

export const metadata: Metadata = {
  title: "Cloud Hosting",
  description: DESCRIPTION,
  alternates: { canonical: "/cloud" },
  openGraph: {
    type: "website",
    url: "/cloud",
    title: "Cloud Hosting | KZD Solutions",
    description: DESCRIPTION,
    siteName: "KZD Solutions",
  },
};

export default function CloudPage() {
  return (
    <ComingSoonProduct
      eyebrow="Cloud Hosting"
      title="Cloud Hosting"
      heroImage="/images (2).jpeg"
      heroAlt=""
      bodyTitle="Cloud Hosting Is On Its Way"
      body="We're building enterprise-grade cloud infrastructure with the scalability, monitoring, and uptime standards you expect from KZD Solutions. It isn't ready to launch just yet, but it's actively in development."
    />
  );
}
