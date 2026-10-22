"use client";

/* Renders the full site footer everywhere except the coming-soon pages,
   which end on their own slim bottom bar (Penpot "Coming soon — …"). The
   footer itself stays a Server Component, passed through as children. */

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isComingSoonPath } from "@/lib/comingSoon";

export default function FooterGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return isComingSoonPath(pathname) ? null : children;
}
