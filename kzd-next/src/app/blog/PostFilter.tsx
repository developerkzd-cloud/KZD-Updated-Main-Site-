"use client";

/* ==========================================================================
   The category pills and the "load more" step — the only interactive part of
   the blog index.

   No card is rendered here. Every post arrives twice, already rendered on the
   server: once as the large featured treatment and once as a grid card. This
   component only decides which posts are shown and which of the two forms each
   one takes. That keeps the cards, and the SVG covers inside them, out of the
   client bundle — what ships is this file and the category strings.

   The featured slot is INSIDE the filter, matching the static site: picking
   "Retail" promotes the newest Retail post to the lead, it does not leave the
   overall newest sitting above a filtered grid.
   ========================================================================== */

import { Children, isValidElement, useState, type ReactNode } from "react";
import styles from "./blog.module.css";

const ALL = "All";
const STEP = 6;

type Slot = React.ReactElement<{ "data-category"?: string }>;

export default function PostFilter({
  categories,
  featuredSlots,
  cardSlots,
}: {
  categories: string[];
  featuredSlots: ReactNode;
  cardSlots: ReactNode;
}) {
  const [active, setActive] = useState(ALL);
  const [shown, setShown] = useState(STEP);

  const featured = Children.toArray(featuredSlots).filter(isValidElement) as Slot[];
  const cards = Children.toArray(cardSlots).filter(isValidElement) as Slot[];

  const keep = (s: Slot) => active === ALL || s.props["data-category"] === active;
  const matchingFeatured = featured.filter(keep);
  const matchingCards = cards.filter(keep);

  /* Same arithmetic as the static site: the lead counts towards the step, so
     "load more" appears only once there is genuinely more to show. */
  const slice = matchingCards.slice(0, shown);
  const lead = matchingFeatured[0];
  const rest = slice.slice(1);

  function choose(category: string) {
    setActive(category);
    setShown(STEP); // a new filter starts from the top, not mid-list
  }

  return (
    <>
      <div className={styles.filters} role="group" aria-label="Filter by category">
        {[ALL, ...categories].map((c) => (
          <button
            key={c}
            type="button"
            className={styles.pill}
            aria-pressed={active === c}
            onClick={() => choose(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Announced rather than silently swapped, so a screen reader hears the
          list change when a pill is pressed. */}
      <p aria-live="polite" className="kzd-sr">
        {matchingCards.length === 0
          ? `No articles in ${active} yet`
          : `Showing ${slice.length} of ${matchingCards.length} articles`}
      </p>

      {lead ?? null}

      {rest.length > 0 && <div className={styles.grid}>{rest}</div>}

      {matchingCards.length === 0 && (
        <p className={styles.empty}>No articles in {active} yet</p>
      )}

      {matchingCards.length > slice.length && (
        <div className={styles.moreWrap}>
          <button type="button" className={styles.more} onClick={() => setShown((n) => n + STEP)}>
            Load more
          </button>
        </div>
      )}
    </>
  );
}
