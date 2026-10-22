"use client";

/* A nav link that marks itself aria-current="page" when its section is open
   (so it picks up the hover/active underline). "Domains" points at
   /domains/register but is current anywhere under /domains. */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function isCurrentSection(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  const section = "/" + href.split("/")[1];
  return pathname === section || pathname.startsWith(section + "/");
}

export default function CurrentLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <Link href={href} className={className} aria-current={isCurrentSection(pathname, href) ? "page" : undefined}>
      {children}
    </Link>
  );
}
