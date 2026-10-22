import type { CSSProperties } from "react";

/* The kzd theme's Tabler icon sprite (themes/kzd/assets/build/symbol/
   icons-sprite.svg), served from /kzd-home so every glyph matches the
   FOSSBilling pages exactly. */
export default function Sprite({ id, className = "icon", style }: { id: string; className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} aria-hidden="true">
      <use href={`/kzd-home/icons-sprite.svg#${id}`} />
    </svg>
  );
}
