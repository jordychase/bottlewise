/**
 * Bottlewise narrator worker.
 *
 * Receives a deterministic ingredient-score breakdown + baby profile,
 * calls Claude with a strict system prompt, returns structured
 * sentences. The Anthropic API key lives in Cloudflare secrets — it
 * never enters the mobile bundle.
 *
 * Architecture contract:
 *   - Model translates the breakdown into prose; it does NOT change
 *     the grade or invent ingredients (per docs/AI_DESIGN.md § 1).
 *   - Output is strict JSON `{ sentences: string[] }`. On any parse
 *     or model failure, we return 200 with the empty array — the
 *     client falls back to its templated narrator. We do NOT throw
 *     500s up to the UI because the UI is meant to gracefully
 *     degrade to templated narration.
 *
 * Endpoint:
 *   POST /
 *   body: { breakdown, formula, profile? }
 *   response: { sentences: string[] }
 */

import { SYSTEM_PROMPT, type NarrationRequest } from "./prompt.js";

export interface Env {
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL: string;
  ANTHROPIC_MAX_TOKENS: string;
  ALLOWED_ORIGINS: string;
}

function corsHeaders(origin: string | null, allowed: string): Record<string, string> {
  const list = allowed.split(",").map((s) => s.trim()).filter(Boolean);
  const ok = origin && list.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : list[0] ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonResponse(
  data: unknown,
  status: number,
  cors: Record<string, string>,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

function isValidRequest(body: unknown): body is NarrationRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (!b.breakdown || typeof b.breakdown !== "object") return false;
  if (!b.formula || typeof b.formula !== "object") return false;
  const breakdown = b.breakdown as Record<string, unknown>;
  const formula = b.formula as Record<string, unknown>;
  if (typeof breakdown.grade !== "string") return false;
  if (!["A", "B", "C", "D", "F"].includes(breakdown.grade as string)) return false;
  if (typeof breakdown.finalScore !== "number") return false;
  if (!Array.isArray(breakdown.concerns)) return false;
  if (!Array.isArray(breakdown.positives)) return false;
  if (typeof formula.brand !== "string") return false;
  if (typeof formula.name !== "string") return false;
  return true;
}

function buildUserMessage(req: NarrationRequest): string {
  const { breakdown, formula, profile } = req;
  const concerns =
    breakdown.concerns.length === 0
      ? "  (none)"
      : breakdown.concerns
          .map(
            (c) =>
              `  - [${c.severity}] ${c.display}: ${c.reason} (source: ${c.source})`,
          )
          .join("\n");
  const positives =
    breakdown.positives.length === 0
      ? "  (none)"
      : breakdown.positives
          .map((p) => `  - ${p.display}: ${p.reason}`)
          .join("\n");
  return [
    `Formula: ${formula.brand} — ${formula.name}`,
    `Grade: ${breakdown.grade} (${breakdown.finalScore}/100)`,
    `Deterministic verdict: ${breakdown.verdict ?? ""}`,
    "",
    "Concerns (in severity order):",
    concerns,
    "",
    "Positives:",
    positives,
    "",
    "Family context:",
    `  - Baby first name: ${profile?.babyNameFirst ?? "(not given)"}`,
    `  - Age (months): ${profile?.babyAgeMonths ?? "(not given)"}`,
    `  - Family soy allergy: ${profile?.familySoyAllergy ? "yes" : "no"}`,
    `  - Family eczema: ${profile?.familyEczema ? "yes" : "no"}`,
    `  - Family CMPA: ${profile?.familyCmpa ? "yes" : "no"}`,
    `  - Preemie: ${profile?.preemie ? "yes" : "no"}`,
    "",
    "Write the note now per the rules in the system prompt.",
  ].join("\n");
}

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
  stop_reason?: string;
}

async function callClaude(
  env: Env,
  payload: NarrationRequest,
): Promise<string[]> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: Number(env.ANTHROPIC_MAX_TOKENS) || 320,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(payload) }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error(`anthropic ${res.status}: ${detail.slice(0, 400)}`);
    return [];
  }

  const data = (await res.json()) as AnthropicResponse;
  const text = data.content?.find((c) => c.type === "text")?.text ?? "";

  // The model is instructed to return JSON `{ sentences: [...] }`.
  // Try to parse; if it slipped a code fence around it, strip and retry.
  const tryParse = (s: string): string[] | null => {
    try {
      const obj = JSON.parse(s);
      if (Array.isArray(obj.sentences) && obj.sentences.every((x: unknown) => typeof x === "string")) {
        return obj.sentences;
      }
    } catch {
      // fall through
    }
    return null;
  };

  let sentences = tryParse(text);
  if (!sentences) {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced && fenced[1]) sentences = tryParse(fenced[1]);
  }
  if (!sentences) {
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) sentences = tryParse(objMatch[0]);
  }

  return sentences ?? [];
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, env.ALLOWED_ORIGINS);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "method not allowed" }, 405, cors);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "invalid JSON body" }, 400, cors);
    }

    if (!isValidRequest(body)) {
      return jsonResponse({ error: "invalid request shape" }, 400, cors);
    }

    if (!env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY not set in worker env");
      return jsonResponse({ sentences: [] }, 200, cors);
    }

    try {
      const sentences = await callClaude(env, body);
      return jsonResponse({ sentences }, 200, cors);
    } catch (err) {
      console.error("narrator failed:", err);
      // Return 200 with empty sentences — the client gracefully falls back
      // to templated narration. We do NOT 500 because that would surface
      // an error state in the UI for what is a degraded-but-acceptable
      // experience.
      return jsonResponse({ sentences: [] }, 200, cors);
    }
  },
};
