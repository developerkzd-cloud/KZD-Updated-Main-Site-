import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import Nav from "@/components/Nav/Nav";
import Footer from "@/components/Footer/Footer";
import FooterGate from "@/components/Footer/FooterGate";
import OfflineGate from "@/components/Offline/OfflineGate";
import RevealObserver from "@/components/Reveal/RevealObserver";
import "./globals.css";

/* Per-route generateMetadata() overrides this. The title template means a page
   supplies only its own name. */
export const metadata: Metadata = {
  metadataBase: new URL("https://kzdsolutions.co.za"),
  title: {
    default: "KZD Solutions | Digital innovation for South African business",
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
      {/* suppressHydrationWarning: some browser extensions (e.g. ColorZilla)
          inject attributes like cz-shortcut-listen onto <body> before React
          hydrates. That's a client-only DOM mutation outside our control, not
          a real server/client mismatch — see
          https://nextjs.org/docs/messages/react-hydration-error */}
      <body suppressHydrationWarning>
        <Nav />
        {/* The nav is fixed, so content clears it here rather than every page
            repeating a magic padding value the way the static site did. */}
        <div className="kzd-below-nav">{children}</div>
        <FooterGate>
          <Footer />
        </FooterGate>
        {/* Covers the page while the connection is down (and registers the
            service worker that serves /offline when a page can't load). */}
        <OfflineGate />
        <RevealObserver />
      </body>
    </html>
  );
}
