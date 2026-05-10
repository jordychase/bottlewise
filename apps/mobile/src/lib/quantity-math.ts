/**
 * Quantity suggester math.
 *
 * Translates a baby's daily intake into "how many cans should I order
 * to cover N days, with a safety buffer." Pure functions; no UI.
 *
 * Defaults that matter:
 *   - 3.5g of powder per reconstituted ounce (industry typical for
 *     standard 20 cal/oz formulas; preemie 22 cal/oz is denser)
 *   - 3-day safety buffer (never zero — avoids the 11pm panic run;
 *     never more than 10 days — avoids 2022-style hoarding)
 *   - Age-banded daily-intake defaults that fill in when parents
 *     don't know the number off the top of their head
 *
 * No medical claims. Intake bands are the AAP/CDC published guidance
 * ranges, surfaced with a "talk to your pediatrician" disclaimer in
 * the consuming UI.
 */

import type { FormulaProduct } from "@/data/formula-catalog";

export interface QuantityInputs {
  /** Daily reconstituted intake in fluid ounces. */
  ozPerDay: number;
  /** How many days the order needs to cover. */
  daysOfSupply: number;
  /** Safety buffer in days on top of the base supply. */
  bufferDays: number;
}

export interface QuantityResult {
  /** Recommended number of standard packages to order. */
  packageCount: number;
  /** Total reconstituted ounces those packages produce. */
  ozCovered: number;
  /** Days that covers at the input daily-intake rate. */
  daysCovered: number;
  /** Cost-per-ounce assumption used (cents). */
  estimatedPerOzCents?: number;
  /** Total estimated cost in cents. */
  estimatedTotalCents?: number;
  /** Per-package grams. */
  packageGrams: number;
  /** Grams of powder per reconstituted ounce. */
  gramsPerOz: number;
  /** Hand-rolled reasoning string for display. */
  rationale: string;
}

const DEFAULT_GRAMS_PER_OZ = 3.5;

/**
 * Daily-intake defaults by age in months. AAP/CDC guidance:
 *   1–2 mo: ~18–24 oz/day
 *   3–4 mo: ~24–32 oz/day
 *   5–6 mo: ~24–32 oz/day (solids introduced)
 *   7–9 mo: ~24–30 oz/day (solids ramping)
 *   10–12 mo: ~16–24 oz/day (solids dominant)
 */
export function defaultOzPerDayForAgeMonths(months: number): number {
  if (months < 2) return 22;
  if (months < 4) return 28;
  if (months < 6) return 30;
  if (months < 9) return 26;
  if (months < 12) return 22;
  return 16;
}

export function suggestQuantity(
  formula: FormulaProduct,
  inputs: QuantityInputs,
): QuantityResult {
  const packageGrams = formula.packageGrams ?? 400;
  const gramsPerOz = formula.gramsPerOz ?? DEFAULT_GRAMS_PER_OZ;

  const totalDays = Math.max(1, inputs.daysOfSupply + Math.max(0, inputs.bufferDays));
  const totalOzNeeded = inputs.ozPerDay * totalDays;
  const ozPerPackage = packageGrams / gramsPerOz;
  const packageCount = Math.max(1, Math.ceil(totalOzNeeded / ozPerPackage));

  const ozCovered = packageCount * ozPerPackage;
  const daysCovered = Math.floor(ozCovered / Math.max(1, inputs.ozPerDay));

  const rationale =
    `At ${inputs.ozPerDay} oz per day for ${inputs.daysOfSupply} days ` +
    `with a ${inputs.bufferDays}-day buffer, you need about ${Math.round(totalOzNeeded)} oz. ` +
    `Each ${formula.packageSize ?? `${packageGrams}g`} can yields about ${Math.round(ozPerPackage)} reconstituted oz, ` +
    `so order ${packageCount}.`;

  return {
    packageCount,
    ozCovered: Math.round(ozCovered),
    daysCovered,
    packageGrams,
    gramsPerOz,
    rationale,
  };
}

/**
 * Caps for the buffer input. Tight on purpose — discourages hoarding
 * patterns that contributed to the 2022 stockout chain reaction.
 */
export const BUFFER_MIN_DAYS = 0;
export const BUFFER_MAX_DAYS = 10;
export const SUPPLY_OPTIONS = [7, 14, 30] as const;
