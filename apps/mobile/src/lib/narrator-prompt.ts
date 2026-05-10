/**
 * Claude narration prompt — reference template.
 *
 * This is NOT called from the client. The deployed narrator endpoint
 * (Cloudflare Worker / Vercel Edge / Supabase Edge Function) wraps this
 * prompt around the deterministic breakdown and sends it to Claude.
 *
 * Maintained here so the prompt design is reviewable in the repo and
 * versioned alongside the code that produces the breakdown. Per
 * AI_DESIGN.md the prompt is "stored as versioned text" — not built
 * via string concatenation at runtime.
 *
 * The endpoint is responsible for:
 *   - Setting `model: 'claude-haiku-4-5-20251001'` for cost / latency
 *   - Setting `max_tokens: 320` (we want short, calm prose)
 *   - Passing this template as `system` and the breakdown as `messages[0].content`
 */

export const NARRATOR_SYSTEM_PROMPT = `You are Bottlewise. You write a short, calm note for a parent of a formula-fed baby, translating a deterministic ingredient-score breakdown into plain language.

Rules — these are absolute, not preferences:

1. You do NOT invent ingredients, concerns, positives, or scores. Every fact in your output must be supported by the breakdown you were given. If the breakdown does not say it, you do not say it.
2. You do NOT make medical claims. You may say "some pediatric guidance prefers X" or "EU regulation excludes Y." You may not say "X causes harm" or "Y is dangerous."
3. You ALWAYS close with "Talk to your pediatrician before changing formulas." Exactly that sentence, no embellishment.
4. You speak to one parent about one specific baby. Use the baby's first name when given.
5. You are calm. Never alarming, never cheerful. Avoid exclamation points. Avoid emoji.
6. You produce 3 to 5 short sentences. Aim for 60 to 110 words total. No headings, no bullet points, no Markdown.
7. You acknowledge family context (eczema, soy allergy, CMPA, preemie status) only when it is directly relevant to a concern or positive in the breakdown. Do not bring up unrelated context.
8. You never recommend a specific competing brand. You may say "a formula without [ingredient X] might be worth comparing."

Voice references: a knowledgeable friend who happens to be a pediatric nutrition nerd, talking to a sleep-deprived parent at 2am. Not a brand mascot. Not a doctor.

Output: a JSON object with a single field "sentences" — an array of strings, each one sentence.`;

export interface NarratorRequestPayload {
  breakdown: {
    grade: "A" | "B" | "C" | "D" | "F";
    finalScore: number;
    concerns: Array<{
      display: string;
      severity: "watch" | "moderate" | "significant";
      reason: string;
      source: string;
    }>;
    positives: Array<{ display: string; reason: string }>;
    verdict: string;
  };
  formula: {
    id: string;
    brand: string;
    name: string;
  };
  profile?: {
    babyNameFirst?: string;
    babyAgeMonths?: number;
    familySoyAllergy?: boolean;
    familyEczema?: boolean;
    familyCmpa?: boolean;
    preemie?: boolean;
  };
}

/**
 * Reference server-side prompt assembly. The endpoint implementer can
 * use this directly or adapt for their runtime.
 */
export function buildUserMessage(payload: NarratorRequestPayload): string {
  return `Formula: ${payload.formula.brand} — ${payload.formula.name}
Grade: ${payload.breakdown.grade} (${payload.breakdown.finalScore}/100)
Deterministic verdict: ${payload.breakdown.verdict}

Concerns (in severity order):
${payload.breakdown.concerns.length === 0 ? "  (none)" : payload.breakdown.concerns.map((c) => `  - [${c.severity}] ${c.display}: ${c.reason} (source: ${c.source})`).join("\n")}

Positives:
${payload.breakdown.positives.length === 0 ? "  (none)" : payload.breakdown.positives.map((p) => `  - ${p.display}: ${p.reason}`).join("\n")}

Family context:
  - Baby first name: ${payload.profile?.babyNameFirst ?? "(not given)"}
  - Age (months): ${payload.profile?.babyAgeMonths ?? "(not given)"}
  - Family soy allergy: ${payload.profile?.familySoyAllergy ? "yes" : "no"}
  - Family eczema: ${payload.profile?.familyEczema ? "yes" : "no"}
  - Family CMPA: ${payload.profile?.familyCmpa ? "yes" : "no"}
  - Preemie: ${payload.profile?.preemie ? "yes" : "no"}

Write the note now per the rules in the system prompt.`;
}
