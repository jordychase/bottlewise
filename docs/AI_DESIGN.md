# Bottlewise — AI Architecture and Design

**Companion to**: `PRD.md`, `DATA_MODEL.md`
**Implementation target**: Anthropic Claude API (Sonnet + Haiku), pgvector RAG

This document specifies how AI is used in Bottlewise. It is the most safety-critical doc in the repo. Read it before changing prompts, models, or retrieval logic.

---

## 1. Principles

1. **Grounded, never freestyle.** The model must never invent a formula. Every formula mentioned in any AI output must exist in the `formulas` table for this query's retrieval context. Any output containing a formula name not in the retrieval context is a regeneration trigger.
2. **Narration over generation.** The recommendation engine produces a deterministic, structured score breakdown. The model translates that breakdown into human-readable language. The model does not invent reasons.
3. **Refusal over wrong.** If retrieval is sparse or the user's question is medical, the model says so and routes to a pediatrician. No best-effort medical answers.
4. **Safety pre-screens before AI.** Every user input passes a safety trigger classifier before the AI sees it. On trigger, the safety interstitial fires and the AI is bypassed.
5. **Determinism where it matters.** Recommendation ranking is deterministic given a fixed input. Only the narration is non-deterministic. Same input must produce same recommendation set across runs (subject to feedback-loop weight updates, which are versioned).

---

## 2. Models and roles

| Surface | Model | Why |
|---|---|---|
| Conversational chat (both flows) | Claude Sonnet | Reasoning quality matters; this is the primary user-facing surface |
| Recommendation narration | Claude Haiku | Cheap, fast, doing structured-input → prose translation |
| Intake parsing (extracting baby profile fields from free-text intake) | Claude Haiku | Structured extraction, low complexity |
| Safety trigger classification | Claude Haiku | First-pass classifier; complemented by deterministic regex |
| Trial outcome notes embedding | Voyage or OpenAI embeddings (TBD per § Open Decisions in `DATA_MODEL.md`) | Embedding-only, not generative |
| Formula attribute embedding | Same as above | Computed offline at seed time and on formula update |

Model versions pinned in `packages/ai/src/config.ts`. Never use a model alias (`claude-sonnet-latest`) — always pin the dated version. Behavior regressions are audited via `recommendations.model_version`.

---

## 3. Retrieval (RAG)

### 3.1 What gets retrieved

For a recommendation query:
- All formulas matching hard filters (allergies, dietary restrictions, stage, FDA-status preference, hard budget ceiling).
- Of those, top K by cosine similarity to the query embedding (K=20 default, configurable).
- Of those, top 3 after applying soft scoring (see § 4).

For a chat query:
- All formulas the user has asked about by name (regex match against `formulas.product_name` and `brands.name`).
- Top K formulas by similarity to the chat query embedding.
- The user's current baby profile.
- The user's recent trial outcomes for this baby.

### 3.2 Retrieval context format passed to Claude

```
<formula_context>
  <formula id="...">
    <name>...</name>
    <brand>...</brand>
    <stage>...</stage>
    <protein>...</protein>
    <key_attributes>...</key_attributes>
    <fda_status>...</fda_status>
    <ingredients>...</ingredients>
    <typical_price_per_oz_cents>...</typical_price_per_oz_cents>
  </formula>
  ...
</formula_context>
```

The system prompt includes: "You may only mention formulas present in the formula_context block. If a user asks about a formula not in the context, respond that you don't have information on that formula and offer to look it up."

### 3.3 Retrieval validation

Before showing AI output to the user:
1. Extract every formula-name-shaped token from the AI output.
2. Match against `formulas.product_name` and known aliases (`brand + product`).
3. If any extracted name fails to match a formula in the retrieval context, regenerate with a stricter system prompt addendum: "Your previous response mentioned [name] which was not in the retrieval context. Do not invent formulas."
4. After 2 failed regenerations, fall back to a deterministic "I'm not finding a clear match for your situation — here's what to ask your pediatrician" response.

---

## 4. Recommendation engine

### 4.1 Algorithm

```
function recommend(baby_profile, query_intent, budget):
  # 1. Hard filters
  candidates = formulas
    .filter(stage matches baby_profile.dob)
    .filter(no ingredient in baby_profile.family_allergy_history.hard_avoid)
    .filter(fda_status acceptable per baby_profile.preferences)
    .filter(price_per_oz <= budget.max if budget set)

  # 2. Construct query vector
  query_vector = embed(canonical_intent_string(baby_profile, query_intent))

  # 3. Similarity ranking
  candidates_ranked = candidates
    .map(f => ({ f, similarity: cosine(f.embedding, query_vector) }))
    .top(20)

  # 4. Soft scoring
  for c in candidates_ranked:
    c.score = c.similarity
    c.score += w_family_history * family_history_match(c.f, baby_profile)
    c.score += w_breastfeeding_bridge * bridge_match(c.f, baby_profile.transition_intent)
    c.score += w_feedback_prior * feedback_prior(c.f, baby_profile_signature)
    c.score -= penalty_high_landed_cost(c.f, baby_profile.zip_code, budget)
    c.score -= penalty_low_stock(c.f, baby_profile.zip_code)

  # 5. Return top 3 + avoid-list
  top_3 = candidates_ranked.sort_desc(score).take(3)
  avoid = compute_avoid_list(baby_profile, top_3)
  return { recommendations: top_3, avoid, score_breakdown: ... }
```

Weights `w_*` are tunable, stored in `packages/ai/src/weights.ts`, versioned alongside `recommendations.model_version`.

### 4.2 Feedback prior

`feedback_prior(formula, baby_profile_signature)` queries aggregated `trial_outcomes` for babies with similar profile signatures (computed via clustering on `baby_profiles` features). Returns a signed score in [-1, 1]:
- +1 if babies with this signature reliably tolerate this formula
- -1 if babies with this signature reliably do not tolerate
- 0 if insufficient data

This is the data flywheel: more trial outcomes → better priors → better recommendations → more trust → more outcomes logged.

### 4.3 Narration prompt

After deterministic ranking, the score breakdown is passed to Haiku with this template (abbreviated):

```
You are Bottlewise. You write clear, warm, non-medical recommendations for parents.

Here is the recommendation result for this baby:
<recommendations>
  <formula rank="1" score_breakdown="...">...</formula>
  <formula rank="2" score_breakdown="...">...</formula>
  <formula rank="3" score_breakdown="...">...</formula>
</recommendations>

Avoid list:
<avoid>...</avoid>

For each recommendation, write 2–3 sentences explaining WHY it ranked here based on the score_breakdown. Use only facts from the breakdown. Do not invent reasons. Do not give medical advice. End with a single sentence reminding the parent to confirm with their pediatrician.

For each avoid item, write 1 sentence explaining the specific attribute that triggered the avoidance.

Format as JSON: { "recommendations": [...], "avoid": [...], "closing": "..." }
```

---

## 5. The two flow system prompts

### 5.1 Flow A — "New to formula"

System prompt structure:
- Identity: "You are Bottlewise, a tool that helps parents new to formula feeding."
- Constraints: only formulas in retrieval context, no medical advice, route to pediatrician on safety triggers.
- Behavior: warm, calm, non-judgmental about feeding decisions. Acknowledge the emotional context of transitioning from breastfeeding when relevant.
- Intake guidance: ask for missing fields one at a time, never overwhelm. Never ask for fields already provided.
- Output: structured intake completion, then handoff to recommendation engine.

### 5.2 Flow B — "On formula, need help"

System prompt structure:
- Identity: "You are Bottlewise helping a parent troubleshoot an existing formula situation."
- Constraints: same as Flow A.
- Behavior: faster, more practical, less hand-holding. Parent has experience and is in a problem-solving mindset.
- Diagnostic framing: ask what's wrong, what they've already tried, what they've ruled out. Surface the substitution options (next closest, next cheapest, next most available) before asking too many questions.
- Output: tailored substitution recommendations or, if the issue is medical-shaped, route to safety interstitial.

Both prompts are stored in `packages/ai/src/prompts/` as versioned text files. No string-concatenation construction at runtime — full prompts in source.

---

## 6. Safety layer

### 6.1 Pre-AI safety triggers

Every user message is screened for:
- Allergic reaction language: `'hives'`, `'swelling'`, `'breathing'`, `'anaphylaxis'`, `'face swell'`, `'lips swell'`
- Bleeding: `'blood in stool'`, `'bloody'`, `'red stool'`, `'hematochezia'`
- Severe vomiting: `'projectile'`, `'won't keep down'`, `'green vomit'`, `'bile'`
- Weight: `'losing weight'`, `'not gaining'`, `'failure to thrive'`
- Dehydration: `'no wet diaper'`, `'sunken'`, `'lethargic'`, `'unresponsive'`
- Self-harm or harm-to-baby language: zero tolerance, always route to crisis resources

Implementation: deterministic regex first-pass + Haiku classifier as second-pass. Either positive triggers the interstitial.

### 6.2 Safety interstitial

A blocking, full-screen UI that:
1. Acknowledges what the parent shared in calm, non-alarming language.
2. Provides clear "call your pediatrician" guidance with a button to dial.
3. For severe cases (anaphylaxis indicators), surfaces 911 and Poison Control.
4. Logs the trigger to `chat_messages.safety_triggered = true` for audit.
5. Does NOT show formula recommendations until the parent affirmatively dismisses the interstitial AND the system reclassifies their next message as non-emergency.

This is a hard gate. There is no path through it that surfaces formula content. This is not a soft warning.

### 6.3 What the safety layer does NOT do

- It does not attempt clinical triage. We are not a clinical tool.
- It does not provide medical advice in the interstitial. It points to clinical resources.
- It does not replace pediatrician judgment in non-triggered conversations. Even non-triggered chats end with "confirm with your pediatrician" framing.

---

## 7. Embedding strategy

### 7.1 Formula embeddings

Each formula has an embedding computed from a canonical attribute string:

```
"[stage] formula with [protein_form] [protein_source] protein, [carb_source] carbohydrate,
[fat_blend description], specialty: [designations], indications: [pediatric_indications],
country of origin: [country], FDA status: [fda_status]"
```

Computed at seed time and on any formula attribute update. Stored in `formulas.embedding`.

### 7.2 Query embeddings

For Flow A intake completion, the query string is:
```
"[stage] formula for baby with [allergy_history], transitioning [transition_intent],
budget [budget_per_oz], looking for [stated_preferences]"
```

For Flow B troubleshooting:
```
"replacement for [current_formula] due to [issue], baby experiencing [symptoms],
preference: [next closest | cheaper | more available]"
```

### 7.3 Trial outcome notes embeddings

Free-text notes are embedded for:
- Similarity search ("show me trial outcomes similar to mine")
- Aggregation ("cluster babies who reported gas issues")
- The public dataset (notes themselves are not published; embeddings are)

---

## 8. Cost control

### 8.1 Token budgeting

- Per-message context cap: 8000 tokens for chat, 4000 for recommendation narration.
- Truncation strategy: prioritize current baby profile and current message; truncate older chat history first; never truncate the system prompt or retrieved formula context.
- Caching: prompt caching on the system prompt and formula context where possible.

### 8.2 Model routing

- Default to Haiku for any classification, extraction, or templated narration.
- Use Sonnet only for open-ended chat where reasoning quality matters.
- Never use Opus in V1. Cost vs benefit is not justified for this product.

### 8.3 Per-user caps

- Soft cap of 50 AI messages per user per day.
- Hard cap of 200 per day.
- Exceedance routes to "you've used your free AI messages today, here's our static formula explorer in the meantime" — does NOT block static features (knowledge base browsing, saved formulas, formula maker settings).

---

## 9. Observability

Every AI call logs:
- `request_id` (uuid)
- `user_id` (nullable for anonymous flows)
- `flow` (recommendation, chat_a, chat_b, narration, safety_classifier, intake_parser)
- `model_version`
- `prompt_template_version`
- `input_token_count`
- `output_token_count`
- `latency_ms`
- `safety_trigger_fired boolean`
- `regeneration_count`
- `outcome` (`'completed' | 'refused' | 'fallback' | 'error'`)

These flow to a `ai_call_logs` table (append-only, partitioned by month). Used for cost tracking, behavior regression detection, and safety audit.

---

## 10. Open AI decisions (require Jordan confirmation)

1. **Embedding provider.** Voyage (high quality, cheaper than OpenAI), OpenAI text-embedding-3, or open-weights MiniLM (free but lower quality)? Affects embedding dimension and `formulas.embedding` schema.
2. **Sonnet vs Haiku for chat.** Brief defaults to Sonnet for chat. If cost becomes a concern in beta, downgrade non-troubleshooting chat to Haiku and reserve Sonnet for substantive recommendations.
3. **Prompt caching scope.** Anthropic prompt caching covers system prompts well. Whether to cache the formula retrieval context is a tradeoff (cache hit rate vs context freshness). Default: cache system prompt only.
4. **Feedback prior cluster granularity.** How fine-grained should baby profile signatures be for the feedback prior lookup? Too coarse = useless; too fine = no data per cluster. Start coarse (5–10 signatures), refine as data grows.
5. **Notes published vs not.** Free-text notes from `trial_outcomes` are NOT published in the public dataset by default. Embeddings ARE. Confirm this is the right tradeoff or if notes should be redacted-and-published with PII scrubbing.
