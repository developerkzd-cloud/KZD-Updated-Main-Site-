/* ==========================================================================
   ArrowIcon — the one arrow used everywhere in the redesign.

   Every button, link and chip that needs an arrow uses this component, never
   the text character "->" or an icon-font glyph. Path data and geometry are
   given exactly by the design brief: 26x12 viewBox, 1.4 stroke, round caps
   and joins, drawn from a shaft (M1 6h23) and a chevron head
   (M19 1.2 L24.2 6 L19 10.8).

   It scales with the surrounding font-size (1em square) and takes its colour
   from currentColor, so it always matches the text it sits beside.
   ========================================================================== */

type Direction = "right" | "down" | "back" | "up-right";

const ROTATION: Record<Direction, number> = {
  right: 0,
  "up-right": -45, // external links
  down: 90,
  back: 180,
};

export default function ArrowIcon({
  direction = "right",
  className,
}: {
  /** "right" (default), "up-right" (external links), "down", "back" */
  direction?: Direction;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 26 12"
      width="1em"
      height="0.46em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${ROTATION[direction]}deg)`, flex: "none" }}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M1 6h23" />
      <path d="M19 1.2 L24.2 6 L19 10.8" />
    </svg>
  );
}
