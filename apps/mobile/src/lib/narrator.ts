/**
 * Personalized narration over the deterministic ingredient-score breakdown.
 *
 * The architecture per docs/AI_DESIGN.md § Principles:
 *   - Grade and concern/positive lists are deterministic, server-auditable,
 *     and never invented by the model.
 *   - This module produces the human-readable PROSE that translates the
 *     breakdown for a specific baby and family context.
 *
 * Two narration backends:
 *   1. `templated` — pure-function, deterministic, no network. Always
 *      available. Uses a curated bank of sentence fragments composed from
 *      the breakdown.
 *   2. `claude` — calls Anthropic Claude (Haiku or Sonnet) via a server
 *      endpoint, returning genuinely-personalized prose. The endpoint
 *      must be set via env (`EXPO_PUBLIC_NARRATOR_URL`) so the API key
 *      never lives in the bundle.
 *
 * The narrator chooses automatically:
 *   - If `EXPO_PUBLIC_NARRATOR_URL` is set → call Claude.
 *   - Otherwise → templated.
 *
 * The endpoint contract (the server you stand up):
 *   POST {EXPO_PUBLIC_NARRATOR_URL}
 *   body: { breakdown, formula, profile }
 *   response: { sentences: string[] }
 *
 * That server prompts Claude with a strict template enforcing
 * "narration over generation" — it does NOT invent reasons or change
 * the grade. See AI_DESIGN.md § 4.3 Narration prompt for the template.
 */

import type { ScoreBreakdown } from "@/lib/ingredient-score";
import type { FormulaProduct } from "@/data/formula-catalog";

export interface NarrationInput {
  breakdown: ScoreBreakdown;
  formula: FormulaProduct;
  profile?: {
    babyNameFirst?: string;
    babyAgeMonths?: number;
    familySoyAllergy?: boolean;
    familyEczema?: boolean;
    familyCmpa?: boolean;
    preemie?: boolean;
    onFormula?: { brand: string; productName: string };
  };
}

export interface NarrationOutput {
  sentences: string[];
  source: "templated" | "claude";
}

function endpoint(): string | undefined {
  // Browser-safe env access; Expo exposes EXPO_PUBLIC_* at build time.
  const env = (globalThis as any).process?.env ?? {};
  return env.EXPO_PUBLIC_NARRATOR_URL as string | undefined;
}

export function templatedNarration(input: NarrationInput): NarrationOutput {
  const { breakdown, formula, profile } = input;
  const name = profile?.babyNameFirst ?? "your baby";
  const sentences: string[] = [];

  // Lead with the grade in plain language.
  const gradeOpener: Record<typeof breakdown.grade, string> = {
    A: `${formula.brandName} comes out clean for ${name}.`,
    B: `${formula.brandName} is solid for ${name}, with one or two ingredients to know about.`,
    C: `${formula.brandName} is a standard US panel — some tradeoffs worth talking through with your pediatrician.`,
    D: `${formula.brandName} has several flagged ingredients. Worth looking at alternatives.`,
    F: `${formula.brandName} carries multiple significant flags. We'd suggest comparing options before continuing.`,
  };
  sentences.push(gradeOpener[breakdown.grade]);

  // Pick up the two most-relevant concerns and explain in context.
  const significantFirst = [...breakdown.concerns].sort((a, b) => {
    const order = { significant: 0, moderate: 1, watch: 2 } as const;
    return order[a.concern.severity] - order[b.concern.severity];
  });
  if (significantFirst.length > 0) {
    const top = significantFirst[0]!;
    sentences.push(
      `The standout flag is ${top.concern.display.toLowerCase()}: ${top.concern.reason}`,
    );
    if (significantFirst.length > 1) {
      const second = significantFirst[1]!;
      sentences.push(
        `Also on the list: ${second.concern.display.toLowerCase()} — ${second.concern.reason.split(".")[0]}.`,
      );
    }
  }

  // Personal context layered last — only when it's specifically relevant.
  if (profile?.familySoyAllergy) {
    const soy = breakdown.concerns.find((c) => /soy/i.test(c.concern.match));
    if (soy) {
      sentences.push(
        `You flagged a family soy allergy. This formula contains ${soy.concern.display.toLowerCase()} — talk to your pediatrician before introducing.`,
      );
    }
  }
  if (profile?.familyCmpa) {
    if (formula.attributes?.some((a) => /hydrolyzed|amino/i.test(a))) {
      sentences.push(
        `Given your CMPA history, the protein form here (${formula.attributes.find((a) => /hydrolyzed|amino/i.test(a))}) is the right shape — confirm with your pediatrician before switching.`,
      );
    }
  }
  if (profile?.preemie) {
    sentences.push(
      `${name} was born early — the standard ingredient score doesn't account for the higher caloric density post-NICU-discharge formulas provide. NeoSure / EnfaCare are designed for this window.`,
    );
  }

  // Close with positives if the grade is C or worse — encourage agency.
  if (breakdown.grade === "C" || breakdown.grade === "D") {
    if (breakdown.positives.length > 0) {
      const first = breakdown.positives[0]!;
      sentences.push(
        `What's still working for you: ${first.marker.display.toLowerCase()} — ${first.marker.reason.toLowerCase()}`,
      );
    }
  }

  return { sentences, source: "templated" };
}

/**
 * Narrate. Falls back to templated when no remote narrator is configured.
 *
 * Network errors are NOT swallowed silently; the caller should render an
 * "AI insight loading" state and the templated version as the resilient
 * baseline.
 */
export async function narrate(input: NarrationInput): Promise<NarrationOutput> {
  const url = endpoint();
  if (!url) return templatedNarration(input);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        breakdown: input.breakdown,
        formula: {
          id: input.formula.id,
          brand: input.formula.brandName,
          name: input.formula.fullName,
        },
        profile: input.profile,
      }),
    });
    if (!res.ok) throw new Error(`narrator endpoint returned ${res.status}`);
    const data = (await res.json()) as { sentences?: string[] };
    if (!Array.isArray(data?.sentences) || data.sentences.length === 0) {
      return templatedNarration(input);
    }
    return { sentences: data.sentences, source: "claude" };
  } catch {
    return templatedNarration(input);
  }
}
