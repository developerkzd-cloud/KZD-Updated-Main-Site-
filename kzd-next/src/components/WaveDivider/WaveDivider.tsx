/* ==========================================================================
   WaveDivider — the white wave that closes a dark hero.

   Ported from the static site's `.shape-image-animation` block, which every
   hero carried (index.html, contact.html, tld-extensions.html and the rest):
   an SVG path with an <animate> that morphs between three states on a 5s
   loop, so the crest drifts instead of sitting still.

   SMIL <animate> rather than CSS because the shape itself is what changes —
   a `d` morph has no CSS equivalent short of hand-rolling it in JS, and this
   is one declarative element with no script attached.

   Hidden below 768px, matching the legacy `d-none d-md-block`: at phone
   width the wave is a sliver that only eats hero height.
   ========================================================================== */

import styles from "./WaveDivider.module.css";

/* The three keyframes, verbatim from the static markup. */
const FROM = "M 0 250 C 1200 400 1200 50 3000 250 L 3000 550 L 0 550 L 0 250";
const MID = "M 0 250 C 400 50 400 400 3000 250 L 3000 550 L 0 550 L 0 250";

export default function WaveDivider() {
  return (
    <div className={styles.wave} aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" height="400" viewBox="0 180 2500 200" fill="#ffffff">
        <path d={FROM}>
          <animate
            attributeName="d"
            dur="5s"
            values={`${FROM};${MID};${FROM}`}
            repeatCount="indefinite"
          />
        </path>
      </svg>
    </div>
  );
}
