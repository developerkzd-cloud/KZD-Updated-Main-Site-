"use client";

/* ==========================================================================
   ServicesAccordion — thin client wrapper around the shared Accordion.

   The nav's Services mega-menu and the footer both link to
   /services#consulting and /services#development. Accordion's
   `defaultOpenId` only sets the INITIAL open item (it is a useState
   initializer, not a controlled prop), so landing on the page with a hash
   already in the URL needs something to read that hash and hand Accordion
   the right initial id.

   The hash is read with useSyncExternalStore, the same pattern
   careers/[id]/JobTabs.tsx uses: the server has no hash, so
   getServerSnapshot returns "" and the server/first-client-render agree,
   then the real hash arrives once the browser subscribes. When it does,
   Accordion is remounted (via `key`) so its internal state re-initializes
   from the new defaultOpenId — a plain effect + setState-on-mount would
   fight React 19's rules for this instead.
   ========================================================================== */

import { useCallback, useSyncExternalStore } from "react";
import Accordion, { type AccordionItem } from "@/components/Accordion/Accordion";

function useHash(): string {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener("hashchange", onStoreChange);
    return () => window.removeEventListener("hashchange", onStoreChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => ""
  );
}

export default function ServicesAccordion({
  items,
  defaultOpenId,
}: {
  items: AccordionItem[];
  defaultOpenId: string;
}) {
  const hash = useHash();
  const hashId = hash.slice(1);
  const openId = items.some((item) => item.id === hashId) ? hashId : defaultOpenId;

  return <Accordion items={items} defaultOpenId={openId} key={openId} />;
}
