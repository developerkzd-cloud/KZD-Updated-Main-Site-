import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

/* Route-level metadata overrides this per page in 3c. The title template means
   a page only has to supply its own name. */
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
      <body>{children}</body>
    </html>
  );
}
