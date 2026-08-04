'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { pathFor } from '@/i18n/routes';
import { buttonClass } from '@/components/ui/button-styles';
import { cn } from '@/lib/cn';
import { track, volumeBucket } from '@/lib/analytics';

type Unit = 'm' | 'ft';
type Waste = 5 | 10 | 15;

const METRES_PER_FOOT = 0.3048;
const METRES_PER_INCH = 0.0254;

const labels = {
  fr: {
    title: 'Estimer le volume pour une dalle de terrasse',
    intro:
      'Entrez les dimensions de la terrasse. Le calcul utilise la formule longueur × largeur × épaisseur.',
    length: 'Longueur',
    width: 'Largeur',
    thickness: 'Épaisseur',
    unit: 'Unité',
    metres: 'mètres',
    feet: 'pieds',
    inches: 'pouces',
    waste: 'Marge',
    net: 'Volume net en m³',
    recommended: 'Volume recommandé avec marge',
    quote: 'Obtenir une soumission pour ce volume',
    fullCalculator: 'Ouvrir le calculateur complet',
  },
  en: {
    title: 'Estimate volume for a patio slab',
    intro: 'Enter the patio dimensions. The calculation uses length × width × thickness.',
    length: 'Length',
    width: 'Width',
    thickness: 'Thickness',
    unit: 'Unit',
    metres: 'metres',
    feet: 'feet',
    inches: 'inches',
    waste: 'Allowance',
    net: 'Net volume in m³',
    recommended: 'Recommended volume with allowance',
    quote: 'Request a quote for this volume',
    fullCalculator: 'Open the full calculator',
  },
} as const;

function parse(value: string): number {
  return Number(value.replace(',', '.'));
}

function toMetres(value: number, unit: Unit): number {
  return unit === 'ft' ? value * METRES_PER_FOOT : value;
}

function thicknessToMetres(value: number, unit: Unit): number {
  return unit === 'ft' ? value * METRES_PER_INCH : value;
}

function format(locale: Locale, value: number): string {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function PatioSlabCalculator({
  locale,
  projectParam,
}: {
  locale: Locale;
  projectParam: string;
}) {
  const t = labels[locale];
  const [unit, setUnit] = useState<Unit>('m');
  const [length, setLength] = useState('4');
  const [width, setWidth] = useState('5');
  const [thickness, setThickness] = useState('0.10');
  const [waste, setWaste] = useState<Waste>(10);
  const hasTrackedUse = useRef(false);

  function trackUse() {
    if (hasTrackedUse.current) return;
    hasTrackedUse.current = true;
    track('patio_calculator_used', { locale, source: 'patio_landing_page' });
  }

  function updateUnit(nextUnit: Unit) {
    trackUse();
    setUnit(nextUnit);
    setThickness(nextUnit === 'ft' ? '4' : '0.10');
  }

  function updateWaste(nextWaste: Waste) {
    trackUse();
    setWaste(nextWaste);
    track('patio_calculator_margin_changed', {
      locale,
      source: 'patio_landing_page',
      wastePercentage: nextWaste,
      unitsType: unit,
    });
  }

  const result = useMemo(() => {
    const values = [length, width, thickness].map(parse);
    if (values.some((value) => !Number.isFinite(value) || value <= 0 || value > 10000)) {
      return { net: 0, recommended: 0, valid: false };
    }
    const [l, w, h] = values;
    const net = toMetres(l!, unit) * toMetres(w!, unit) * thicknessToMetres(h!, unit);
    return {
      net,
      recommended: net * (1 + waste / 100),
      valid: true,
    };
  }, [length, thickness, unit, waste, width]);

  const quoteHref = result.valid
    ? `${pathFor('quote', locale)}?project=${encodeURIComponent(projectParam)}&length=${encodeURIComponent(length)}&width=${encodeURIComponent(width)}&thickness=${encodeURIComponent(thickness)}&unit=${unit}&volume=${result.recommended.toFixed(2)}`
    : `${pathFor('quote', locale)}?project=${encodeURIComponent(projectParam)}`;

  const fullCalculatorHref = `${pathFor('calculator', locale)}?project=${encodeURIComponent(projectParam)}`;

  return (
    <section className="rounded-card border-line bg-surface shadow-card border p-5 md:p-6 xl:p-5">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_0.48fr] xl:gap-5">
        <div>
          <h2 id="patio-calculator" className="text-2xl">
            {t.title}
          </h2>
          <p className="text-ink-muted mt-1.5 leading-relaxed">{t.intro}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <NumberField
              label={`${t.length} (${unit === 'ft' ? t.feet : t.metres})`}
              value={length}
              onChange={setLength}
              onUse={trackUse}
            />
            <NumberField
              label={`${t.width} (${unit === 'ft' ? t.feet : t.metres})`}
              value={width}
              onChange={setWidth}
              onUse={trackUse}
            />
            <NumberField
              label={`${t.thickness} (${unit === 'ft' ? t.inches : t.metres})`}
              value={thickness}
              onChange={setThickness}
              onUse={trackUse}
            />

            <label className="block">
              <span className="font-semibold">{t.unit}</span>
              <select
                value={unit}
                onChange={(event) => updateUnit(event.target.value as Unit)}
                className="border-line-strong bg-surface mt-2 h-12 w-full rounded-lg border px-3 xl:h-11"
              >
                <option value="m">{t.metres}</option>
                <option value="ft">{t.feet}</option>
              </select>
            </label>

            <fieldset className="sm:col-span-2 xl:col-span-4">
              <legend className="font-semibold">{t.waste}</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([5, 10, 15] as const).map((value) => (
                  <label
                    key={value}
                    className={cn(
                      'border-line-strong flex min-h-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold xl:min-h-10',
                      waste === value
                        ? 'bg-accent text-white'
                        : 'bg-surface text-ink-soft hover:bg-surface-sunken',
                    )}
                  >
                    <input
                      type="radio"
                      name="patioWaste"
                      checked={waste === value}
                      onChange={() => updateWaste(value)}
                      className="sr-only"
                    />
                    {value} %
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        <aside className="border-accent bg-accent-tint rounded-card border p-5 xl:p-5">
          <dl className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-muted">{t.net}</dt>
              <dd className="font-display text-2xl font-bold tabular-nums">
                {result.valid ? `${format(locale, result.net)} m³` : '—'}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-muted">{t.recommended}</dt>
              <dd className="font-display text-3xl font-bold tabular-nums">
                {result.valid ? `${format(locale, result.recommended)} m³` : '—'}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-col gap-3">
            <Link
              href={quoteHref}
              onClick={() =>
                track('patio_calculator_quote_clicked', {
                  locale,
                  source: 'patio_landing_page',
                  unitsType: unit,
                  wastePercentage: waste,
                  volumeBucket: volumeBucket(result.valid ? result.recommended : null),
                })
              }
              className={buttonClass('primary', 'md', 'w-full')}
            >
              {t.quote}
            </Link>
            <Link
              href={fullCalculatorHref}
              onClick={() =>
                track('patio_full_calculator_clicked', {
                  locale,
                  source: 'patio_landing_page',
                  unitsType: unit,
                  wastePercentage: waste,
                })
              }
              className={buttonClass('secondary', 'md', 'w-full')}
            >
              {t.fullCalculator}
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  onUse,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUse: () => void;
}) {
  return (
    <label className="block">
      <span className="font-semibold">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => {
          onUse();
          onChange(event.target.value);
        }}
        className="border-line-strong bg-surface mt-2 h-12 w-full rounded-lg border px-3 xl:h-11"
      />
    </label>
  );
}
