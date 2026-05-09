# Bottlewise — Product Requirements Document

**Status**: V1 specification, pre-implementation
**Owner**: Jordan Soblick
**Last updated**: 2026-05-09

---

## 1. Vision

Make formula-feeding less anxious, more transparent, and more personalized for every family — regardless of income, demographics, or prior experience. Use AI not to replace pediatric guidance but to help parents arrive at their pediatrician conversation already informed, with a shortlist of options matched to their baby's profile, their budget, and what's actually available to them right now.

Build it open source so the dataset of real-world formula trial outcomes — what worked for which babies under which conditions — becomes a public good, not the proprietary moat of any single brand.

## 2. Positioning and compliance framework

Bottlewise is positioned as **Tier 1 — Information & Decision-Support**.

- We surface, summarize, and rank formulas based on user-supplied baby profile data and a curated knowledge base.
- We never diagnose. We never prescribe. We never claim a formula will treat a condition.
- Every recommendation surface includes a non-dismissable "not medical advice — confirm with your pediatrician" framing.
- Safety triggers (mention of allergic reaction, blood in stool, severe vomiting, weight loss, dehydration) interrupt the AI flow and route to a "contact your pediatrician immediately" interstitial before any formula content is shown.
- We use FDA-registered formulas only. European-import formulas are flagged with their FDA enforcement-discretion status and clearly labeled as not FDA-reviewed.

This positioning is architected so a Phase 2 unlock to **Tier 2 — Pediatrician-in-the-Loop** is additive, not a rewrite. Schema and AI layer must support an optional `reviewing_clinician_id` field on recommendation snapshots from V1 even though it goes unused initially.

## 3. Users and entry flows

### 3.1 Two primary entry flows

**Flow A — "New to formula"**
- Parent has not yet chosen a formula or is preparing to start.
- Often transitioning from breastfeeding, or supplementing.
- Needs guided intake: baby age, weight, family allergy history, breastfeeding status, budget, location.
- Output: 3 recommended formulas with reasoning, plus 1–2 "avoid because X" callouts where applicable.

**Flow B — "On formula, need help"**
- Parent already feeding a formula but encountering a problem (tolerance, supply, cost, recall).
- Needs targeted intake: current formula, what's wrong, baby symptoms, what they've already tried.
- Output: ranked alternatives via similarity engine, with explicit reasoning for why each is a closer or different match. Includes "next closest option" if the issue is supply/cost vs tolerance vs ingredient preference.

These are different state machines, not just different copy. Each has its own conversation tree, its own intake schema, and its own AI system prompt.

### 3.2 Anti-personas (out of scope for V1)

- Parents seeking a medical diagnosis. Routed to pediatrician.
- Parents asking about toddler formula or milk substitutes for >12mo. Phase 2.
- Parents asking about supplemental formulas for adult medical use. Out of scope permanently.

## 4. Core feature set (V1)

### 4.1 Onboarding and baby profile

- Email or magic-link auth (no password — passwordless flow via Supabase Auth).
- Multiple babies per account (twins, siblings).
- Per-baby profile fields: name (optional), DOB, sex (optional), birth weight, current weight (optional, with privacy framing), gestational age at birth, family allergy history (cow milk protein, soy, nuts, eczema, asthma — checkboxes), current feeding status, current formula(s) if any.
- ZIP code for stock localization. Never share or display publicly.
- Budget capture: total monthly formula budget, or per-can preference range.

### 4.2 Formula knowledge base

- Curated database, seeded with all FDA-registered formulas available in US retail (Similac line, Enfamil line, Gerber, Kirkland, Bobbie, ByHeart, Kendamil USA, Earth's Best, Happy Baby, Holle USA, etc.) plus the most common European-import formulas with their enforcement-discretion status (HiPP, Holle EU, Kendamil UK, Lebenswert, Aptamil where applicable).
- Per-formula attributes: brand, manufacturer, country of origin, FDA registration status, stage, protein source, protein form (intact, partially hydrolyzed, extensively hydrolyzed, amino acid), carbohydrate source, fat blend (palm/no palm, DHA mg, ARA mg), specialty designations (organic, A2, non-GMO, kosher, halal, lactose-free), pediatric indications (sensitive, gentle, anti-reflux, hypoallergenic, premature), price points (MSRP, typical retail, per-ounce reconstituted), formula-maker settings per device.

### 4.3 Recommendation engine

- Hard filters first: any allergy/avoidance, stage match, FDA-status preference, hard budget ceiling.
- Soft scoring: similarity to expressed preferences, family history priors, breastfeeding-bridge appropriateness if Flow A indicates transition.
- Output: top 3 with explicit reasoning, optionally 1–2 "avoid because" callouts. Each card cites the specific attributes driving the recommendation.
- Reasoning is generated by Claude (Haiku for cost) from a structured score breakdown — the AI does not freestyle, it narrates a structured decision.

### 4.4 Similarity engine ("next closest option")

This is the technical centerpiece of V1.

- Each formula vectorized across protein source, protein form, carb source, fat blend, specialty designations, pediatric indications, price tier, stage.
- pgvector cosine similarity, with a configurable weighting per attribute family.
- Hard constraints (allergies, dietary restrictions) applied as filters before similarity ranking.
- Same model powers both the primary recommendation engine (when intake completes) and the on-demand "next closest" lookup (when a parent reports a stock-out or tolerance issue).

### 4.5 Cost layer

- Per-formula price record from multiple sources (MSRP, Amazon, Walmart, Target, BuyBuyBaby), with timestamp.
- Per-ounce and per-serving normalization.
- For imported formulas: HTS code, country of origin, current duty rate, Section 301/232 surcharges if applicable, average customs clearance delay (days). Landed cost = retail price + duty + shipping + clearance buffer.
- Tariff data refreshed weekly via `scripts/refresh-tariffs.ts` from USITC API + a manually maintained overlay for current Section 301 status.
- "Tariff impact" badge on imported formula cards: e.g., "Imported from Germany — typical 2-week clearance, +12% landed cost vs MSRP."

### 4.6 Stock signals

Probabilistic, multi-source. Stock is a confidence score, never a boolean.

- **Online (Phase 1, V1)**: Amazon PA-API and Walmart Open API polled hourly for availability and price. Surfaced as "available online — confirmed [timestamp]."
- **Local crowdsource (Phase 1, V1)**: Parents can mark "in stock" or "out of stock" at a specific store address. Reports decay (1.0 confidence at 0h, 0.5 at 24h, 0.1 at 72h, 0 at 7d). Reputation system: contributors with consistent accurate reports weighted higher.
- **DTC partnerships (Phase 2)**: Direct API integration with Bobbie, ByHeart, Kendamil USA where available. Real-time availability surfaced authoritatively.
- **Out-of-stock cascade**: When a recommended formula is unavailable, the similarity engine surfaces "next closest available" with reasoning for the substitution. This is the killer feature — it's what would have made the product a household name in the 2022 crisis.

### 4.7 Feedback loop

The most important schema in the system.

- After 7 days on a formula, prompt the parent: "How is [formula] working for [baby name]?"
- Capture: tolerance (well/mixed/poor), specific issues observed (gas, reflux, constipation, fussiness, rash, allergic reaction), would_recommend_to_similar (yes/no/unsure), free-text notes.
- Snapshot baby profile at time of trial (so we can later learn "babies with eczema family history tolerated X").
- Aggregate, anonymize, publish. The dataset is open source and queryable.
- Feedback weights flow back into the recommendation engine as priors for similar profiles.

This is the data flywheel. It's the reason being open source matters — no single brand could ethically build this, but a community can.

### 4.8 Formula maker settings library

- Per (formula × maker model × stage) record of correct calibration: scoop type, water-to-powder ratio, recommended setting, known issues.
- Maker models supported V1: Baby Brezza Pro Advanced, Baby Brezza Formula Pro, Tommee Tippee Perfect Prep, Dr. Brown's Insta-Feed.
- User can mark "this works" or "this didn't work" per (formula × maker × setting) — this is a parallel feedback loop.

### 4.9 Breast-to-formula bridge

- Mode toggle for parents transitioning from exclusive breastfeeding or mixed feeding.
- Specialized intake: current breastfeeding frequency, reason for transition, timeline preference (gradual vs immediate).
- AI-generated transition plan: schedule template, formula recommendations weighted toward gentle-introduction options, clear "consult your pediatrician about timing" framing.
- This is a high-anxiety moment — UI tone is calmer, more reassuring, less data-dense.

### 4.10 AI chat surface

- Conversational interface available throughout the app.
- Constrained system prompt: only answers from knowledge base, never invents formulas, redirects medical questions to pediatrician.
- Two distinct system prompts for the two flows.
- Hard refusal patterns for: medical diagnosis, dosing recommendations beyond manufacturer label, claims of efficacy for any condition.

## 5. AI architecture (overview)

See `docs/AI_DESIGN.md` for full detail.

- **Models**: Claude Sonnet for primary chat and reasoning, Claude Haiku for classification, intake parsing, and recommendation narration.
- **Pattern**: RAG over the formula knowledge base (pgvector). The LLM does not know about formulas from training — it only sees formulas retrieved from the database for the current query.
- **Hard constraints**: System prompt enforces that no formula may be mentioned that is not in the retrieved context. Output is parsed and validated against the formula table — any hallucinated brand triggers a regeneration with stricter retrieval.
- **Reasoning generation**: The recommendation engine produces a structured score breakdown deterministically. Claude only narrates the breakdown into human-readable language. This means the "why" is always grounded in actual computed features, not invented post-hoc.
- **Safety layer**: Pre-screen every user message for safety triggers (allergic reaction language, bleeding, severe symptoms, mentions of harm). On trigger, the safety interstitial fires before the AI sees the message.

## 6. Data model (overview)

See `docs/DATA_MODEL.md` for full schema.

Key entities: `users`, `babies`, `baby_profiles`, `formulas`, `formula_ingredients`, `formula_attributes`, `brands`, `manufacturers`, `retailers`, `prices`, `tariff_data`, `stock_signals`, `formula_maker_settings`, `formula_trials`, `trial_outcomes`, `recommendations`, `substitution_events`.

Critical design choices:
- All recommendation outputs are snapshotted to `recommendations` so we can analyze what we recommended vs what happened.
- All baby profile changes are versioned — when a trial outcome is logged, we snapshot the profile at that moment.
- Price records are append-only with timestamps. Never updated in place.
- Stock signals are append-only with confidence-decay computed at read time.

## 7. Phased roadmap

### Phase 0 — Foundation (Weeks 1–2)
- Repo scaffold (Expo + Supabase + pnpm workspaces).
- Database schema migrations.
- Seed knowledge base with top 30 US-available formulas.
- Auth flow (Supabase magic link).
- CI/CD: Vercel for web preview, GitHub Actions for tests and lint.

### Phase 1 — Core MVP (Weeks 3–6)
- Onboarding for both flows (A and B).
- Baby profile CRUD.
- Recommendation engine (filters + similarity ranking + Claude narration).
- AI chat surface with both system prompts.
- Safety interstitial layer.
- Static formula detail pages.

### Phase 2 — Cost and stock (Weeks 7–10)
- Price record schema and ingestion from MSRP and a single retail source (Amazon PA-API).
- Tariff layer: USITC integration, landed cost calculator, "tariff impact" badge.
- Stock signal schema.
- Online stock polling job (`scripts/stock-poll.ts`).
- Out-of-stock cascade UX.

### Phase 3 — Feedback and community (Weeks 11–14)
- Trial outcome schema and capture flow.
- Crowdsourced local stock reporting.
- Reputation system for crowdsource contributors.
- Aggregated public dataset export (versioned release artifact).
- Formula maker settings library and feedback.

### Phase 4 — Bridge and polish (Weeks 15–18)
- Breast-to-formula bridge mode.
- Walmart Open API as second stock source.
- Beta tester recruitment (target: 100 families across diverse demographics).
- App Store and Play Store submission prep.
- Native build via EAS.

### Phase 5 — Post-launch unlocks
- DTC brand partnership APIs (Bobbie, ByHeart).
- Pediatrician-in-the-loop (Tier 2 positioning unlock).
- Telehealth referral via Veridian Health.
- Genetics integration (23andMe, Ancestry import).
- Internationalization.

## 8. Compliance framework

- **FDA**: We list FDA-registered formulas. We do not market formulas. We do not claim efficacy. We are an information service.
- **European import status**: Each non-FDA-reviewed formula is flagged. Enforcement-discretion status is shown explicitly. Status field is versioned because this changes.
- **Disclaimers**: Every recommendation surface, every formula detail page, every chat session opens with "not medical advice" framing. Hard-coded, not dismissable, not bypassable by repeat visit.
- **Safety triggers**: Pre-screening for allergic reaction, bleeding, severe symptoms, weight loss, harm. Routes to pediatrician interstitial.
- **Data privacy**: Baby health data is sensitive. COPPA does not apply (we don't serve children directly), but parental anxiety about data is real. Clear data export, clear data deletion, clear data sharing policy. Aggregated public dataset is anonymized at a level where no individual baby can be reidentified.
- **Affiliate disclosure**: If/when affiliate revenue is introduced, every affiliate link is disclosed inline per FTC guidance. No dark patterns. No paid-placement in the recommendation engine, ever.
- **Open source license**: MIT or Apache 2.0 (TBD — see Open Decisions).

## 9. Open decisions (require Jordan confirmation before implementation)

These are flagged with `// TODO(jordan)` in code where applicable.

1. **Affiliate revenue from V1 vs strictly non-commercial through open-source phase.** Affects schema (`affiliate_link` table), disclosure copy, and FTC compliance work.
2. **License: MIT vs Apache 2.0 vs AGPL.** AGPL would protect the data flywheel from closed-source forks but reduces adoption. MIT is most permissive. Apache 2.0 is the middle ground with patent grant.
3. **Stack confirmation.** Brief assumes Expo + Supabase based on prior pattern (BeyondMyBenefits). Confirm or override.
4. **Stock data Phase 1 scope.** Brief assumes Amazon PA-API only for V1, Walmart in Phase 4. Confirm whether Walmart should ship simultaneously.
5. **Crowdsource trust model.** Reputation system as described, or simpler "all reports weighted equal, decayed by time only" for V1?
6. **Public dataset release cadence.** Monthly versioned release? Live API? On-demand request?
7. **Beta tester recruitment channel.** Existing Veridian Health audience? r/FormulaFeeders? Pediatric practice partnerships?
8. **Branding / copy tone.** Calm and clinical, or warm and friendly, or somewhere between? Affects every UI string.
9. **Pediatric advisory board.** Even at Tier 1 positioning, having 1–2 named pediatricians review the seed knowledge base and the safety triggers significantly strengthens the legal posture. Yes / no / Phase 2?

## 10. Success metrics (V1)

- **Activation**: % of new accounts that complete baby profile and receive first recommendation.
- **Recommendation quality**: % of recommended formulas where the user reports trial outcome at 30 days.
- **Substitution success**: % of out-of-stock cascades that result in user adopting the suggested alternative.
- **Feedback contribution**: % of active users who log a trial outcome.
- **Cost transparency value**: % of users who say "Bottlewise helped me save money" in 30-day post-onboarding survey.
- **Safety**: zero recommendations surfaced after a safety trigger fires (hard requirement, not a metric to optimize — a metric to monitor for regressions).

---

## Appendix A — Glossary

- **HTS code**: Harmonized Tariff Schedule classification used by US Customs to determine duty.
- **Section 301**: Trade Act tariffs, primarily affecting Chinese-origin goods.
- **Enforcement discretion**: FDA term for non-registered formulas the agency has chosen not to enforce against (originated in 2022 crisis, status varies by brand and over time).
- **A2 milk**: Cow milk producing only A2 beta-casein, marketed as easier to digest.
- **Hydrolyzed**: Protein broken down to smaller fragments. Partially hydrolyzed = "gentle." Extensively hydrolyzed = "hypoallergenic."
- **Stage 1/2/3**: 0–6mo, 6–12mo, 12mo+ in EU labeling. US uses Infant (0–12mo) and Toddler (12mo+).

## Appendix B — Reference research priorities for Claude Code

When implementing, retrieve and cite:
- FDA Infant Formula Act current text and registered-formula list
- USITC HTS chapter 19 (tariff classifications for milk-based food preparations)
- Recent (2023+) FDA enforcement-discretion announcements for European brands
- Amazon PA-API current schema and rate limits
- Walmart Open API current schema and rate limits
- pgvector latest indexing best practices for cosine similarity at the scale of ~200 formulas
