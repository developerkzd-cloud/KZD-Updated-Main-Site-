<?php

declare(strict_types=1);

namespace DiceBear;

use DiceBear\Error\CircularColorReferenceError;
use DiceBear\Utils\Color as ColorUtil;

/**
 * Bundles the three inputs needed to derive any deterministic value for an
 * avatar — the {@see Style}, the validated user {@see Options}, and a seeded
 * {@see Prng} — and exposes them as named accessors. Each accessor memoizes
 * its result so that repeated calls cannot drift. The memo also serves as
 * the informational snapshot returned by {@see resolved} — every value the
 * resolver picks during one resolution lands there, except for the raw seed.
 *
 * @internal
 */
class Resolver
{
    private Style $style;
    private Options $options;
    private Prng $prng;
    /** @var list<string> */
    private array $colorResolving = [];
    /** @var array<string, mixed> */
    private array $result = [];

    public function __construct(Style $style, Options $options)
    {
        $this->style = $style;
        $this->options = $options;
        $this->prng = new Prng($this->seed());
    }

    public function seed(): string
    {
        // Deliberately not memoized — the seed is the only input we keep out
        // of the {@see resolved} snapshot, so a serialized avatar never leaks it.
        return $this->options->seed() ?? '';
    }

    public function size(): ?int
    {
        return $this->memo('size', fn() => $this->options->size());
    }

    public function idRandomization(): bool
    {
        return $this->memo('idRandomization', fn() => $this->options->idRandomization() ?? false);
    }

    public function title(): ?string
    {
        return $this->memo('title', fn() => $this->options->title());
    }

    public function flip(): string
    {
        return $this->memo(
            'flip',
            fn() => $this->prng->pick('flip', $this->options->flip()) ?? 'none',
        );
    }

    public function fontFamily(): string
    {
        return $this->memo(
            'fontFamily',
            fn() => $this->prng->pick('fontFamily', $this->options->fontFamily()) ?? 'system-ui',
        );
    }

    public function fontWeight(): int|float
    {
        return $this->memo(
            'fontWeight',
            fn() => $this->prng->pick('fontWeight', $this->options->fontWeight()) ?? 400,
        );
    }

    public function scale(): float
    {
        return $this->memoFloat('scale', $this->options->scale(), 1.0);
    }

    public function borderRadius(): float
    {
        return $this->memoFloat('borderRadius', $this->options->borderRadius(), 0.0);
    }

    public function rotate(): float
    {
        return $this->memoFloat('rotate', $this->options->rotate(), 0.0);
    }

    public function translateX(): float
    {
        return $this->memoFloat('translateX', $this->options->translateX(), 0.0);
    }

    public function translateY(): float
    {
        return $this->memoFloat('translateY', $this->options->translateY(), 0.0);
    }

    /**
     * Selects a variant for the given component. Depending on what was passed
     * as `${name}Variant` in the input data:
     *
     * - `null`: PRNG picks from all style variants using their weights.
     * - otherwise: PRNG picks using the user-supplied weighted map (a bare
     *   string or string list is normalized to weight `1` each in
     *   {@see Options::componentVariant()}).
     *
     * Only variants that exist in the style definition are considered.
     */
    public function variant(string $name): ?string
    {
        return $this->memo("{$name}Variant", function () use ($name) {
            $components = $this->style->components();
            $component = $components[$name] ?? null;

            if ($component === null || !$this->isVisible($name, $component)) {
                return null;
            }

            $raw = $this->options->componentVariant($component->sourceName());
            $variants = $component->variants();
            $weights = [];

            if ($raw === null) {
                foreach ($variants as $v => $variant) {
                    $weights[$v] = $variant->weight();
                }
            } else {
                foreach ($raw as $v => $weight) {
                    if (isset($variants[$v])) {
                        $weights[$v] = $weight;
                    }
                }
            }

            return $this->prng->weightedPick("{$name}Variant", $weights);
        });
    }

    /**
     * @return list<string>
     */
    public function color(string $name): array
    {
        return $this->memo("{$name}Color", fn() => $this->resolveColor($name));
    }

    public function colorFill(string $name): string
    {
        return $this->memo(
            "{$name}ColorFill",
            fn() => $this->prng->pick("{$name}ColorFill", $this->options->colorFill($name)) ?? 'solid',
        );
    }

    public function colorAngle(string $name): float
    {
        return $this->memoFloat("{$name}ColorAngle", $this->options->colorAngle($name), 0.0);
    }

    /**
     * Picks the rotate/translateX/translateY/scale values for a single
     * component. Memoized per `name`, so the four values land in
     * {@see resolved} as `${name}Rotate` / `${name}TranslateX` /
     * `${name}TranslateY` / `${name}Scale` for downstream introspection.
     *
     * @return array{rotate: float, translateX: float, translateY: float, scale: float}
     */
    public function componentTransform(string $name): array
    {
        $components = $this->style->components();
        $component = $components[$name] ?? null;

        return [
            'rotate' => $this->memoFloat("{$name}Rotate", $component?->rotate(), 0.0),
            'translateX' => $this->memoFloat("{$name}TranslateX", $component?->translate()->x(), 0.0),
            'translateY' => $this->memoFloat("{$name}TranslateY", $component?->translate()->y(), 0.0),
            'scale' => $this->memoFloat("{$name}Scale", $component?->scale(), 1.0),
        ];
    }

    /**
     * Returns an informational snapshot of every value the resolver picked.
     * Includes top-level options (scale/rotate/translate/…), per-component
     * variants/probabilities/colors, and per-component transform picks. The
     * raw seed is deliberately excluded.
     *
     * The snapshot is NOT a round-trip-able options object — extra keys like
     * `${name}Rotate` are not part of the user-options schema and feeding the
     * snapshot back into a new {@see Avatar} is not supported. Callers that
     * need to reproduce an avatar should pass the original `seed` and
     * user-supplied options.
     *
     * Unset entries (null) are filtered out so they disappear on JSON encode,
     * mirroring the JS behavior.
     *
     * Whole-number floats (e.g. `scale` 1.0, `rotate` 0.0) are left as floats
     * here. `json_encode()` drops the zero fraction by default — `1.0` encodes
     * to `1` — so the snapshot stays byte-identical to the JS, Rust, and Python
     * ports. This relies on the default encoder behavior: passing
     * `JSON_PRESERVE_ZERO_FRACTION` would emit `1.0` and break that parity.
     *
     * @return array<string, mixed>
     */
    public function resolved(): array
    {
        return array_filter($this->result, static fn($v) => $v !== null);
    }

    /**
     * Returns the visibility probability (0–100) for the given component.
     * Aliases read the source component's user-set probability so a single
     * `<source>Probability` option propagates to every alias of the source.
     */
    private function probability(Style\Component $component): int|float
    {
        $raw = $this->options->componentProbability($component->sourceName());

        return $raw ?? $component->probability();
    }

    private function isVisible(string $name, Style\Component $component): bool
    {
        return $this->prng->bool("{$name}Probability", $this->probability($component));
    }

    /**
     * Resolves a named color to its final stop list, applying contrast
     * sorting and `notEqualTo` filtering from the style definition. Detects
     * circular references between colors and throws
     * {@see CircularColorReferenceError}.
     *
     * @return list<string>
     */
    private function resolveColor(string $name): array
    {
        $userColors = $this->options->color($name);
        $styleColors = $this->style->colors();
        $styleColor = $styleColors[$name] ?? null;
        $source = $userColors ?? $styleColor?->values() ?? [];

        $candidates = array_map(fn($c) => ColorUtil::toHex($c), $source);
        $fill = $this->colorFill($name);
        $stops = $fill === 'solid' ? 1 : $this->colorFillStops($name);

        if ($styleColor === null) {
            return array_slice($this->prng->shuffle("{$name}Color", $candidates), 0, $stops);
        }

        // Detect circular references (e.g. a.contrastTo = b, b.contrastTo = a)
        if (in_array($name, $this->colorResolving, true)) {
            throw new CircularColorReferenceError(array_merge($this->colorResolving, [$name]));
        }

        $this->colorResolving[] = $name;
        $contrastTo = $styleColor->contrastTo();
        $notEqualTo = $styleColor->notEqualTo();

        try {
            if ($contrastTo !== null) {
                $refColor = $this->color($contrastTo)[0] ?? null;

                if ($refColor !== null) {
                    $candidates = ColorUtil::sortByContrast($candidates, $refColor);
                }
            }

            if (count($notEqualTo) > 0) {
                $excluded = [];

                foreach ($notEqualTo as $ref) {
                    foreach ($this->color($ref) as $color) {
                        $excluded[] = $color;
                    }
                }

                $candidates = ColorUtil::filterNotEqualTo($candidates, $excluded);
            }
        } finally {
            array_pop($this->colorResolving);
        }

        // Skip shuffle when sorted by contrast to preserve the ordering
        $ordered = $contrastTo !== null
            ? $candidates
            : $this->prng->shuffle("{$name}Color", $candidates);

        return array_slice($ordered, 0, $stops);
    }

    private function colorFillStops(string $name): int
    {
        $range = $this->options->colorFillStops($name);

        return $range === null ? 2 : $this->prng->integer("{$name}ColorFillStops", $range);
    }

    /** @param array{min: int|float, max: int|float, step?: int|float}|null $range */
    private function memoFloat(string $key, ?array $range, float $fallback): float
    {
        return $this->memo($key, fn() => $range === null ? $fallback : $this->prng->float($key, $range));
    }

    private function memo(string $key, callable $compute): mixed
    {
        if (array_key_exists($key, $this->result)) {
            return $this->result[$key];
        }

        $value = $compute();
        $this->result[$key] = $value;

        return $value;
    }
}
