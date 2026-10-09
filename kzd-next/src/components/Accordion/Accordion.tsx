"use client";

/* ==========================================================================
   Accordion — generic expand/collapse list.

   Used by /services (Consulting / Development) and /hosting (FAQ), replacing
   js/kzd-accordion.js and the .chp-faq-question click handler respectively.
   Each item can be given an `id` so it is independently linkable
   (/services#consulting) and independently openable from the outside via
   `defaultOpenId`.
   ========================================================================== */

import { useState, type ReactNode } from "react";
import styles from "./Accordion.module.css";

export type AccordionItem = {
  id: string;
  question: ReactNode;
  answer: ReactNode;
};

export default function Accordion({
  items,
  defaultOpenId,
}: {
  items: AccordionItem[];
  defaultOpenId?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? items[0]?.id ?? null);

  return (
    <div className={styles.accordion}>
      {items.map((item) => {
        const open = item.id === openId;
        return (
          <div className={styles.item} id={item.id} key={item.id}>
            <h3 className={styles.heading}>
              <button
                type="button"
                className={styles.trigger}
                aria-expanded={open}
                aria-controls={`${item.id}-panel`}
                onClick={() => setOpenId(open ? null : item.id)}
              >
                <span>{item.question}</span>
                <span className={styles.icon} aria-hidden="true">{open ? "−" : "+"}</span>
              </button>
            </h3>
            <div className={styles.panel} id={`${item.id}-panel`} hidden={!open}>
              <div className={styles.panelBody}>{item.answer}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
