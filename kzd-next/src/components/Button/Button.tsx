/* ==========================================================================
   Button — the three variants from the design brief.

     primary   solid --color-ink, white label — the default, for light
               backgrounds and dark footers alike (it's already dark).
     secondary outline, border + label in currentColor — put it inside any
               wrapper that sets `color`, and it reads correctly on both
               light pages (dark outline, the ambient default) and a dark
               hero (white outline), with no separate "on dark" prop needed.
     light     solid white, dark label — for use ON a dark/photo background,
               where a plain `primary` button would vanish. Confirmed on the
               Hero's main CTA, which renders this at 60% opacity over the
               photo rather than solid; pass `frosted` to match that exactly
               where the button sits over imagery, and leave it solid
               elsewhere (e.g. a flat dark footer).

   No vertical padding: height is fixed and the label is centred by
   inline-flex + align-items:center + line-height:1, not by padding
   arithmetic — the pattern that avoids mobile label-centring bugs.

   Renders an <a> (via next/link) when `href` is given, a <button>
   otherwise. Carries no "use client" directive of its own: it is plain
   presentational markup, safe to render from a Server Component page with
   just an href, or from a Client Component with an onClick.
   ========================================================================== */

import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import ArrowIcon from "@/components/ArrowIcon/ArrowIcon";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "light";
type ArrowDirection = "right" | "down" | "back" | "up-right";

type CommonProps = {
  variant?: Variant;
  /** Only meaningful on variant="light": the 60%-opacity glass treatment
      confirmed on the Hero CTA, for buttons sitting over a photo. */
  frosted?: boolean;
  icon?: ArrowDirection;
  children: ReactNode;
  className?: string;
};

type AsLink = CommonProps & { href: string; external?: boolean } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "href" | "className"
  >;
type AsButton = CommonProps & { href?: undefined } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className"
  >;

export default function Button(props: AsLink | AsButton) {
  const { variant = "primary", frosted, icon, children, className, ...rest } = props;
  const classes = [
    styles.btn,
    styles[variant],
    frosted && variant === "light" && styles.frosted,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const arrowDir = icon ?? (("external" in rest && rest.external) ? "up-right" : undefined);
  const content = (
    <>
      <span>{children}</span>
      {arrowDir && <ArrowIcon direction={arrowDir} />}
    </>
  );

  if ("href" in props && props.href) {
    const { href, external, ...anchorRest } = rest as AsLink;
    return (
      <Link
        href={href}
        className={classes}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        {...anchorRest}
      >
        {content}
      </Link>
    );
  }

  const { type = "button", ...buttonRest } = rest as AsButton;
  return (
    <button type={type} className={classes} {...buttonRest}>
      {content}
    </button>
  );
}
