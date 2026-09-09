import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import "./globals.css";

/* Per-route generateMetadata() overrides this. The title template means a page
   supplies only its own name. */
export const metadata: Metadata = {
  metadataBase: new URL("https://kzdsolutions.co.za"),
  title: {
    default: "KZD Solutions — Digital innovation for South African business",
    template: "%s | KZD Solutions",
  },
  description:
    "KZD Solutions helps businesses optimise and scale through process improvement, custom software and digital platforms.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <Nav />
        {/* The nav is fixed, so content clears it here rather than every page
            repeating a magic padding value the way the static site did. */}
        <div className="kzd-below-nav">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
