'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { pathFor } from '@/i18n/routes';
import { buttonClass } from '@/components/ui/button-styles';
import { cn } from '@/lib/cn';
import { track } from '@/lib/analytics';
import {
  addWasteFactor,
  calculateCircularSlabVolume,
  calculateCylinderVolume,
  calculateHollowCylinderVolume,
  calculateRectangularVolume,
} from '@/lib/concrete-calculator/formulas';
import { cubicMetersToCubicYards } from '@/lib/concrete-calculator/units';
import type { GeometryType, LengthUnit, WastePercent } from '@/lib/concrete-calculator/types';

type CalculatorStrings = (typeof import('@/messages/fr.json'))['concreteCalculator'];

const GEOMETRIES: GeometryType[] = ['rectangular', 'cylinder', 'circularSlab', 'hollowCylinder'];
const UNITS: LengthUnit[] = ['mm', 'cm', 'm', 'in', 'ft'];
const WASTE_OPTIONS: WastePercent[] = [0, 5, 10, 15];

type DimensionKey =
  'length' | 'width' | 'thickness' | 'diameter' | 'height' | 'outerDiameter' | 'innerDiameter';

type FormState = Record<DimensionKey, { value: string; unit: LengthUnit }> & {
  quantity: string;
  wastePercent: WastePercent;
};

const INITIAL: FormState = {
  length: { value: '3', unit: 'm' },
  width: { value: '3', unit: 'm' },
  thickness: { value: '10', unit: 'cm' },
  diameter: { value: '1', unit: 'm' },
  height: { value: '1', unit: 'm' },
  outerDiameter: { value: '1', unit: 'm' },
  innerDiameter: { value: '50', unit: 'cm' },
  quantity: '1',
  wastePercent: 10,
};

const FIELDS: Record<GeometryType, DimensionKey[]> = {
  rectangular: ['length', 'width', 'thickness'],
  cylinder: ['diameter', 'height'],
  circularSlab: ['diameter', 'thickness'],
  hollowCylinder: ['outerDiameter', 'innerDiameter', 'height'],
};

function parseDecimal(value: string): number {
  return Number(value.replace(',', '.'));
}

function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function quantityUrlValue(value: number): string {
  return value.toFixed(2);
}

export function calculatorQuoteHref({
  locale,
  recommendedVolume,
  quoteContext,
}: {
  locale: Locale;
  recommendedVolume?: number;
  quoteContext?: { cityName: string; landingPage: string };
}): string {
  const base = pathFor('quote', locale);
  const params = new URLSearchParams();
  if (recommendedVolume !== undefined) params.set('volume', quantityUrlValue(recommendedVolume));
  if (quoteContext?.cityName) params.set('city', quoteContext.cityName);
  if (quoteContext?.landingPage) params.set('landing_page', quoteContext.landingPage);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

function unitFamily(state: FormState, geometry: GeometryType): string {
  const units = FIELDS[geometry].map((field) => state[field].unit);
  const hasMetric = units.some((unit) => unit === 'mm' || unit === 'cm' || unit === 'm');
  const hasImperial = units.some((unit) => unit === 'in' || unit === 'ft');
  if (hasMetric && hasImperial) return 'mixed';
  return hasImperial ? 'imperial' : 'metric';
}

export function ConcreteCalculator({
  locale,
  strings,
  quoteContext,
}: {
  locale: Locale;
  strings: CalculatorStrings;
  quoteContext?: { cityName: string; landingPage: string };
}) {
  const [geometry, setGeometry] = useState<GeometryType>('rectangular');
  const [state, setState] = useState<FormState>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [calculationCount, setCalculationCount] = useState(0);
  const [highlightResult, setHighlightResult] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    track('concrete_calculator_viewed', {
      locale,
      city: quoteContext?.cityName,
      landing_page: quoteContext?.landingPage,
    });
  }, [locale, quoteContext?.cityName, quoteContext?.landingPage]);

  useEffect(() => {
    if (calculationCount === 0) return;
    const timeout = window.setTimeout(() => setHighlightResult(false), 1200);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduceMotion && window.matchMedia('(max-width: 1023px)').matches) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    return () => window.clearTimeout(timeout);
  }, [calculationCount]);

  const errors = useMemo(() => validate(state, geometry, strings), [geometry, state, strings]);
  const result = useMemo(() => {
    if (Object.keys(errors).length > 0) return null;
    const quantity = Number.parseInt(state.quantity, 10);
    const dimension = (key: DimensionKey) => ({
      value: parseDecimal(state[key].value),
      unit: state[key].unit,
    });

    const calculated =
      geometry === 'rectangular'
        ? calculateRectangularVolume({
            length: dimension('length'),
            width: dimension('width'),
            thickness: dimension('thickness'),
            quantity,
          })
        : geometry === 'cylinder'
          ? calculateCylinderVolume({
              diameter: dimension('diameter'),
              height: dimension('height'),
              quantity,
            })
          : geometry === 'circularSlab'
            ? calculateCircularSlabVolume({
                diameter: dimension('diameter'),
                thickness: dimension('thickness'),
                quantity,
              })
            : calculateHollowCylinderVolume({
                outerDiameter: dimension('outerDiameter'),
                innerDiameter: dimension('innerDiameter'),
                height: dimension('height'),
                quantity,
              });

    return {
      calculated,
      recommended: addWasteFactor(calculated, state.wastePercent),
    };
  }, [errors, geometry, state]);

  const active = strings.geometries[geometry];
  const recommendedLabel = result ? `${formatNumber(locale, result.recommended)} m³` : null;
  const quoteHref = useMemo(() => {
    return calculatorQuoteHref({
      locale,
      recommendedVolume: result?.recommended,
      quoteContext,
    });
  }, [locale, quoteContext, result]);

  function updateDimension(field: DimensionKey, patch: Partial<FormState[DimensionKey]>) {
    setState((prev) => ({ ...prev, [field]: { ...prev[field], ...patch } }));
  }

  function handleCalculate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0 || !result) {
      track('concrete_calculator_validation_failed', {
        locale,
        geometryType: geometry,
        unitsType: unitFamily(state, geometry),
        wastePercentage: state.wastePercent,
        city: quoteContext?.cityName,
        landing_page: quoteContext?.landingPage,
        errorCount: Object.keys(errors).length,
      });
      return;
    }
    setHighlightResult(true);
    setCalculationCount((count) => count + 1);
    track('concrete_calculator_calculated', {
      locale,
      geometryType: geometry,
      unitsType: unitFamily(state, geometry),
      wastePercentage: state.wastePercent,
      city: quoteContext?.cityName,
      landing_page: quoteContext?.landingPage,
    });
  }

  return (
    <section
      aria-labelledby="calculator-tool-title"
      className="border-line bg-surface shadow-card rounded-card border p-4 md:p-5 lg:p-6"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0 xl:w-[64%]">
          <p className="text-accent font-display text-sm font-bold tracking-wide uppercase">
            {strings.toolEyebrow}
          </p>
          <h2 id="calculator-tool-title" className="mt-1 text-2xl sm:text-3xl">
            {strings.toolTitle}
          </h2>

          <div
            role="tablist"
            aria-label={strings.selectorLabel}
            className="mt-5 flex gap-2 overflow-x-auto pb-1"
          >
            {GEOMETRIES.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={geometry === item}
                onClick={() => {
                  track('concrete_calculator_geometry_changed', {
                    locale,
                    geometryType: item,
                    source: geometry,
                  });
                  setGeometry(item);
                  setSubmitted(false);
                }}
                className={cn(
                  'border-line-strong min-h-11 shrink-0 rounded-lg border px-3 text-left text-sm font-semibold transition-colors',
                  geometry === item
                    ? 'bg-steel text-white'
                    : 'bg-surface text-ink-soft hover:bg-surface-sunken hover:text-ink',
                )}
              >
                {strings.geometries[item].shortLabel}
              </button>
            ))}
          </div>

          <form onSubmit={handleCalculate} noValidate className="mt-5 grid gap-4 sm:grid-cols-2">
            {FIELDS[geometry].map((field) => (
              <DimensionField
                key={`${geometry}-${field}`}
                id={field}
                label={strings.fields[field]}
                value={state[field].value}
                unit={state[field].unit}
                error={submitted ? errors[field] : undefined}
                unitLabels={strings.units}
                onValueChange={(value) => updateDimension(field, { value })}
                onUnitChange={(unit) => updateDimension(field, { unit })}
              />
            ))}

            <div>
              <label htmlFor="quantity" className="text-ink font-semibold">
                {strings.fields.quantity}
              </label>
              <input
                id="quantity"
                type="number"
                min={1}
                max={1000}
                step={1}
                inputMode="numeric"
                value={state.quantity}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, quantity: event.target.value }))
                }
                aria-invalid={submitted && errors.quantity ? true : undefined}
                aria-describedby={submitted && errors.quantity ? 'quantity-error' : undefined}
                className="border-line-strong bg-surface mt-2 h-12 w-full rounded-lg border px-3 text-base"
              />
              {submitted && errors.quantity ? (
                <p id="quantity-error" className="text-danger mt-1 text-sm">
                  {errors.quantity}
                </p>
              ) : null}
            </div>

            <fieldset className="sm:col-span-2">
              <legend className="text-ink font-semibold">{strings.result.wasteLabel}</legend>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {WASTE_OPTIONS.map((option) => (
                  <label
                    key={option}
                    className={cn(
                      'border-line-strong flex min-h-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold',
                      state.wastePercent === option
                        ? 'bg-accent text-white'
                        : 'bg-surface text-ink-soft hover:bg-surface-sunken',
                    )}
                  >
                    <input
                      type="radio"
                      name="wastePercent"
                      value={option}
                      checked={state.wastePercent === option}
                      onChange={() => {
                        track('concrete_calculator_allowance_changed', {
                          locale,
                          geometryType: geometry,
                          wastePercentage: option,
                        });
                        setState((prev) => ({ ...prev, wastePercent: option }));
                      }}
                      className="sr-only"
                    />
                    {option}%
                  </label>
                ))}
              </div>
              <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                {strings.result.wasteCopy}
              </p>
            </fieldset>

            {submitted && errors.form ? (
              <p className="text-danger sm:col-span-2" role="alert">
                {errors.form}
              </p>
            ) : null}

            <button
              type="submit"
              className={buttonClass(
                'primary',
                'lg',
                'shadow-raised w-full cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-px sm:col-span-2',
              )}
            >
              {strings.calculate}
            </button>
          </form>
        </div>

        <aside className="xl:w-[36%]">
          <div className="bg-surface-sunken rounded-card p-4">
            <GeometryDiagram geometry={geometry} strings={strings} />
            <h3 className="mt-4 text-xl">{active.title}</h3>
            <p className="text-ink-muted mt-2 text-sm leading-relaxed">{active.description}</p>
            <p className="text-ink-soft bg-surface mt-3 rounded-lg p-3 text-sm font-semibold">
              {active.formula}
            </p>
          </div>

          <div
            ref={resultRef}
            role="status"
            aria-live="polite"
            className={cn(
              'border-accent bg-accent-tint rounded-card mt-4 border p-4 transition-all duration-500',
              highlightResult
                ? 'ring-accent/35 shadow-raised scale-[1.015] ring-4'
                : 'shadow-card scale-100 ring-0',
            )}
          >
            <h3 className="text-xl">{strings.result.title}</h3>
            {result ? (
              <>
                <dl className="mt-4 space-y-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-ink-muted text-sm">{strings.result.calculated}</dt>
                    <dd className="font-display text-right text-2xl font-bold whitespace-nowrap">
                      {formatNumber(locale, result.calculated)} m³
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-ink-muted text-sm">
                      {strings.result.withWaste.replace('{percent}', String(state.wastePercent))}
                    </dt>
                    <dd className="font-display text-right text-3xl font-bold whitespace-nowrap xl:text-[2rem]">
                      {recommendedLabel}
                    </dd>
                  </div>
                </dl>
                {locale === 'en' ? (
                  <p className="text-ink-muted mt-2 text-sm whitespace-nowrap">
                    ≈ {formatNumber(locale, cubicMetersToCubicYards(result.recommended))} yd³
                  </p>
                ) : null}
                <p className="text-ink-muted mt-3 text-sm">{strings.result.disclaimer}</p>
                <p className="font-display mt-5 text-lg font-bold">{strings.result.ctaTitle}</p>
                <Link
                  href={quoteHref}
                  onClick={() =>
                    track('calculator_quote_clicked', {
                      locale,
                      geometryType: geometry,
                      unitsType: unitFamily(state, geometry),
                      wastePercentage: state.wastePercent,
                      city: quoteContext?.cityName,
                      landing_page: quoteContext?.landingPage,
                    })
                  }
                  className={buttonClass('primary', 'lg', 'mt-3 w-full')}
                >
                  {strings.result.quoteButton.replace('{volume}', recommendedLabel ?? '')}
                </Link>
              </>
            ) : (
              <p className="text-ink-muted mt-3 text-sm leading-relaxed">{strings.result.empty}</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function validate(
  state: FormState,
  geometry: GeometryType,
  strings: CalculatorStrings,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of FIELDS[geometry]) {
    const value = parseDecimal(state[field].value);
    if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) {
      errors[field] = strings.errors.dimension;
    }
  }

  const quantity = Number.parseInt(state.quantity, 10);
  if (String(quantity) !== state.quantity.trim() || quantity < 1 || quantity > 1000) {
    errors.quantity = strings.errors.quantity;
  }

  if (geometry === 'hollowCylinder') {
    const outer = parseDecimal(state.outerDiameter.value);
    const inner = parseDecimal(state.innerDiameter.value);
    if (Number.isFinite(outer) && Number.isFinite(inner) && inner >= outer) {
      errors.innerDiameter = strings.errors.innerDiameter;
    }
  }

  return errors;
}

function DimensionField({
  id,
  label,
  value,
  unit,
  error,
  unitLabels,
  onValueChange,
  onUnitChange,
}: {
  id: DimensionKey;
  label: string;
  value: string;
  unit: LengthUnit;
  error?: string;
  unitLabels: Record<LengthUnit, string>;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: LengthUnit) => void;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="text-ink font-semibold">
        {label}
      </label>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="border-line-strong bg-surface h-12 min-w-0 rounded-lg border px-3 text-base"
        />
        <select
          aria-label={`${label} unit`}
          value={unit}
          onChange={(event) => onUnitChange(event.target.value as LengthUnit)}
          className="border-line-strong bg-surface h-12 rounded-lg border px-2 text-sm font-semibold"
        >
          {UNITS.map((option) => (
            <option key={option} value={option}>
              {unitLabels[option]}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p id={errorId} className="text-danger mt-1 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function GeometryDiagram({
  geometry,
  strings,
}: {
  geometry: GeometryType;
  strings: CalculatorStrings;
}) {
  const label = strings.diagram;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 360 210"
      className="border-line bg-surface h-auto w-full rounded-lg border"
      fill="none"
    >
      <defs>
        <marker
          id={`arrow-${geometry}`}
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="4"
          orient="auto"
        >
          <path d="M0 0 L8 4 L0 8 Z" fill="#c2410c" />
        </marker>
      </defs>
      {geometry === 'rectangular' ? (
        <>
          <path d="M88 70h144l42 34H130L88 70Z" fill="#f1efec" stroke="#17181c" strokeWidth="3" />
          <path d="M130 104h144v34H130z" fill="#fff" stroke="#17181c" strokeWidth="3" />
          <path d="M88 70v34l42 34v-34L88 70Z" fill="#e2dfda" stroke="#17181c" strokeWidth="3" />
          <path
            d="M90 48h140"
            stroke="#c2410c"
            strokeWidth="3"
            markerStart={`url(#arrow-${geometry})`}
            markerEnd={`url(#arrow-${geometry})`}
          />
          <text x="160" y="38" textAnchor="middle" className="fill-ink text-[14px] font-bold">
            {label.length}
          </text>
          <path
            d="M282 72v62"
            stroke="#c2410c"
            strokeWidth="3"
            markerStart={`url(#arrow-${geometry})`}
            markerEnd={`url(#arrow-${geometry})`}
          />
          <text x="302" y="107" className="fill-ink text-[14px] font-bold">
            {label.thickness}
          </text>
        </>
      ) : geometry === 'hollowCylinder' ? (
        <>
          <ellipse
            cx="180"
            cy="78"
            rx="86"
            ry="38"
            fill="#f1efec"
            stroke="#17181c"
            strokeWidth="3"
          />
          <ellipse cx="180" cy="78" rx="40" ry="17" fill="#fff" stroke="#17181c" strokeWidth="3" />
          <path d="M94 78v54c0 21 38 38 86 38s86-17 86-38V78" stroke="#17181c" strokeWidth="3" />
          <path d="M140 78v48c0 10 18 18 40 18s40-8 40-18V78" stroke="#17181c" strokeWidth="3" />
          <path
            d="M96 38h168"
            stroke="#c2410c"
            strokeWidth="3"
            markerStart={`url(#arrow-${geometry})`}
            markerEnd={`url(#arrow-${geometry})`}
          />
          <text x="180" y="28" textAnchor="middle" className="fill-ink text-[14px] font-bold">
            {label.outerDiameter}
          </text>
          <path
            d="M140 112h80"
            stroke="#c2410c"
            strokeWidth="3"
            markerStart={`url(#arrow-${geometry})`}
            markerEnd={`url(#arrow-${geometry})`}
          />
          <text x="180" y="106" textAnchor="middle" className="fill-ink text-[14px] font-bold">
            {label.innerDiameter}
          </text>
        </>
      ) : (
        <>
          <ellipse
            cx="180"
            cy="66"
            rx="82"
            ry="34"
            fill="#f1efec"
            stroke="#17181c"
            strokeWidth="3"
          />
          <path
            d="M98 66v74c0 19 37 34 82 34s82-15 82-34V66"
            fill="#fff"
            stroke="#17181c"
            strokeWidth="3"
          />
          <path d="M98 66c0 19 37 34 82 34s82-15 82-34" stroke="#17181c" strokeWidth="3" />
          <path
            d="M98 32h164"
            stroke="#c2410c"
            strokeWidth="3"
            markerStart={`url(#arrow-${geometry})`}
            markerEnd={`url(#arrow-${geometry})`}
          />
          <text x="180" y="22" textAnchor="middle" className="fill-ink text-[14px] font-bold">
            {label.diameter}
          </text>
          <path
            d="M282 66v74"
            stroke="#c2410c"
            strokeWidth="3"
            markerStart={`url(#arrow-${geometry})`}
            markerEnd={`url(#arrow-${geometry})`}
          />
          <text x="300" y="107" className="fill-ink text-[14px] font-bold">
            {geometry === 'circularSlab' ? label.thickness : label.height}
          </text>
        </>
      )}
    </svg>
  );
}
