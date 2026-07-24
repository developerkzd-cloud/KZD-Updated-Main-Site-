<?php

namespace DebugBar\Bridge\Twig;

use DebugBar\Bridge\Twig\MeasureTwigTokenParser;
use DebugBar\DataCollector\TimeDataCollector;
use Twig\Extension\AbstractExtension;

/**
 * Access debugbar timeline measure in your Twig templates.
 * Based on Symfony\Bridge\Twig\Extension\StopwatchExtension
 *
 * @package DebugBar\Bridge\Twig
 */
class MeasureTwigExtension extends AbstractExtension
{
    protected ?TimeDataCollector $timeCollector;

    /**
     * @var string
     */
    protected string $tagName;

    public function __construct(?TimeDataCollector $timeCollector, string $tagName = 'measure')
    {
        $this->timeCollector = $timeCollector;
        $this->tagName = $tagName;
    }

    /**
     * {@inheritDoc}
     */
    public function getName()
    {
        return static::class;
    }

    /**
     * @return \Twig\TokenParser\TokenParserInterface[]
     */
    public function getTokenParsers()
    {
        return [
            /*
             * {% measure foo %}
             * Some stuff which will be recorded on the timeline
             * {% endmeasure %}
             */
            new MeasureTwigTokenParser(!is_null($this->timeCollector), $this->tagName, $this->getName()),
        ];
    }

    public function startMeasure(...$arg)
    {
        if (!$this->timeCollector) {
            return;
        }

        $this->timeCollector->startMeasure(...$arg);
    }

    public function stopMeasure(...$arg)
    {
        if (!$this->timeCollector) {
            return;
        }

        $this->timeCollector->stopMeasure(...$arg);
    }
}
