/* /offline — what the service worker (public/sw.js) serves when a page is
   opened with no connection. It is cached at install, together with the
   CSS, scripts, fonts and logo it needs, so it renders with no network. */

import type { Metadata } from "next";
import OfflineScreen from "@/components/Offline/OfflineScreen";

export const metadata: Metadata = {
  title: "You are offline",
  description: "This page needs an internet connection.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return <OfflineScreen />;
}
