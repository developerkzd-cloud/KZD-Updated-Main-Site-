import type { Metadata } from "next";
import ComingSoonProduct from "@/components/ComingSoonProduct/ComingSoonProduct";

const DESCRIPTION =
  "WordPress-optimised hosting from KZD Solutions — in active development.";

export const metadata: Metadata = {
  title: "WordPress Hosting",
  description: DESCRIPTION,
  alternates: { canonical: "/wordpress" },
  openGraph: {
    type: "website",
    url: "/wordpress",
    title: "WordPress Hosting | KZD Solutions",
    description: DESCRIPTION,
    siteName: "KZD Solutions",
  },
};

export default function WordPressPage() {
  return (
    <ComingSoonProduct
      eyebrow="WordPress Hosting"
      title="WordPress Hosting"
      heroImage="/images (2).jpeg"
      heroAlt=""
      bodyTitle="WordPress Hosting Is On Its Way"
      body="We're building a WordPress-optimised hosting environment with fast loading times, automatic updates, and a smoother experience for bloggers, businesses, and online stores. It isn't ready to launch just yet, but it's actively in development."
    />
  );
}
