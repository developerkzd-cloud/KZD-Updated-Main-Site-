<?php

declare(strict_types=1);

namespace DiceBear\Style;

/**
 * Read-only view over an entry in a component's `variants` block.
 */
class ComponentVariant
{
    /** @var list<Element>|null */
    private ?array $elements = null;

    /**
     * @param array<string, mixed> $data
     */
    public function __construct(private readonly array $data) {}

    /**
     * Returns the variant's elements, lazily wrapped as {@see Element}
     * instances on first access.
     *
     * @return list<Element>
     */
    public function elements(): array
    {
        return $this->elements ??= array_map(
            fn(array $el) => new Element($el),
            $this->data['elements'],
        );
    }

    /**
     * Returns the weighted-pick weight for this variant, defaulting to `1`.
     */
    public function weight(): int|float
    {
        return $this->data['weight'] ?? 1;
    }
}
