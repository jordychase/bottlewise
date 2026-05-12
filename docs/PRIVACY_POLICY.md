# Bottlewise Privacy Policy

**Effective:** 2026-05-11

Bottlewise is an information and decision-support tool for parents of formula-fed babies. This Privacy Policy explains what information Bottlewise collects, why we collect it, where it lives, and what you can do with it. We try to keep it short and honest. If something here is unclear, email **privacy@bottlewise.app**.

This document is the canonical text. It is reviewed before every public release and changes are version-stamped.

> ⚠ **This is a working draft.** It is suitable for an in-app surface and an App Store / Play Store submission package. It is NOT a substitute for review by your own privacy counsel. Have a lawyer read it before you sign anything.

---

## 1. Who we are

Bottlewise is operated by Jordan Chase (sole proprietor, US). When this section names a company, it means the same operator. Contact: privacy@bottlewise.app.

## 2. What Bottlewise is, plainly

Bottlewise is a decision-support tool. It helps you find an infant formula that matches your baby's profile, your family's history, and your budget. **It is not medical advice. It is not a medical device. It does not diagnose, treat, or claim to cure any condition.** Every recommendation surface includes "talk to your pediatrician" framing. Safety triggers — recall events, allergic-reaction reports, severe-symptom language — route to a pediatrician-consult interstitial before any formula content is shown.

## 3. What we collect

We collect only what we need to do the job.

### 3.1 Information you give us about your baby

- **First name** (optional — we accept "Baby" as a default)
- **Date of birth** (used to derive age in months for intake-amount defaults and stage-of-formula matching)
- **Sex** (optional)
- **Birth weight** (optional, for preemie matching)
- **Gestational age at birth** (optional, for preemie matching)
- **Family allergy history** (flags: cow milk protein allergy, soy, peanut, eczema, asthma, other)
- **Current feeding status** (exclusive breastfeeding / mixed / exclusive formula / transitioning)
- **Current formula(s)** if you've told us
- **Observed feeding issues** (a free list of symptoms — gas, reflux, etc.)
- **Bottle preparation method** (hand-measure / Baby Brezza / etc.)

These fields are stored on your device first. When you sign in (planned future feature), they are mirrored to a database (Supabase, US-East-1 region) under your user ID. They are visible only to you.

### 3.2 Information you give us about yourself

- **Email address** (for sign-in, when auth is enabled)
- **ZIP code** (optional — used to localize stock signals to retailers near you)
- **Monthly budget** (optional — used to weight cost in recommendations)

### 3.3 Information about your formula trials and outcomes

- **Which formulas you've tried with which baby**
- **Trial start and end dates**
- **Tolerance outcomes** — "going well" / "mixed" / "not great" / "severe reaction"
- **Issues observed during the trial** (gas, reflux, rash, etc.)
- **A free-text note** you wrote about the experience

These are part of the feedback loop that makes Bottlewise more useful over time. You decide whether each individual trial outcome stays private, is shared anonymously with the Bottlewise community, or is shared with your first name only. The default is **shared anonymously**, never identifying. You can change the visibility of any trial outcome at any time. See § 5.

### 3.4 Information Bottlewise generates on your behalf

- **Recommendations** Bottlewise surfaced to you and which one you opened (used for quality measurement)
- **Substitution events** (when you used the "find next closest" feature and what you picked)
- **A snapshot of your baby's profile** at the moment of each recommendation (so we can audit changes over time)

### 3.5 What we DO NOT collect

- No Social Security number, no tax ID
- No precise GPS location (ZIP code only, and optional)
- No advertising identifiers
- No photos of your baby — we do not ask for them and we do not accept them
- No payment information (Bottlewise is free at this stage)
- No third-party social-network logins
- No microphone, no camera, no contacts, no calendar

## 4. Why we collect it

Each field listed in § 3 maps to one of these purposes:

1. **Matching.** Baby profile fields drive the recommendation engine. Without them the product can't do its job.
2. **Safety.** Age, allergy history, and observed issues feed the safety-trigger classifier (e.g., allergic-reaction mentions route to pediatrician interstitial before any formula content shows).
3. **Stock localization.** ZIP code lets Bottlewise tell you which formulas are in stock at retailers near you.
4. **Cost transparency.** Budget lets Bottlewise rank affordability into recommendations.
5. **Feedback loop.** Trial outcomes feed an anonymized public dataset (when you consent) that helps other parents.
6. **Quality measurement.** Recommendation snapshots let us audit and improve the engine.

We do not use any of this data to sell advertising, build a marketing profile of you, or train third-party language models on your private content.

## 5. Your consent over community contribution

Every individual trial outcome you log carries a consent level you set, with three options:

- **Private** — Only you see it. Never shared with the community.
- **Anonymous** — Published to the Bottlewise community surface without any identifier. Your first name, baby name, location, and account details are never attached. Other parents see only what you wrote.
- **First name** — Same as anonymous, plus your first name is attached. No last name, no location, no account details.

The default is **Anonymous**. You can change the visibility of any past trial outcome at any time in your trial history.

## 6. Where the data lives

**Today (V1):** Your baby profile and trial outcomes are stored in your browser's localStorage on this device only. Nothing leaves your device unless you submit a community-shared trial outcome.

**When sign-in is enabled (planned):** Your data will be mirrored to a Supabase Postgres database hosted in the US East region. Row-level security (Postgres RLS) ensures that only your account can read and write your own rows.

**Aggregated public dataset:** Trial outcomes with consent level set to "Anonymous" or "First name" are exposed via a security-definer view that strips your user ID, your baby's identifiers, and (in the Anonymous case) any identifying text. The free-text note is excluded entirely from the public dataset; only the structured fields (tolerance, observed issues) and an embedding-based similarity index are published.

## 7. Who we share data with

**No one, except:**

- **Supabase** (US-based) processes data on Bottlewise's behalf for hosting. Subject to a Data Processing Agreement.
- **Cloudflare** (US-based) hosts the optional narration-generation worker. The worker receives the deterministic ingredient-score breakdown and your baby's first name + age + family allergy flags to generate personalized text. The worker does not store this data — each call is stateless.
- **Anthropic** (Claude API, US-based) processes the same payload when narration is enabled. Anthropic's API does not train models on inputs and we have requested zero data retention. See § 8.
- **No advertisers.**
- **No data brokers.**
- **No aggregated sale of your personal data.**

When required by law (subpoena, court order, lawful government request) we will respond. We will notify you unless we are legally prohibited from doing so.

## 8. Anthropic / Claude specifics

If you have personalized narration enabled, the following payload is sent to Anthropic's Claude API on each formula detail page view:

- The deterministic ingredient-score breakdown for the formula you're viewing
- Your baby's first name, age in months, and family allergy flags
- The formula name and brand

The payload does NOT include: your full account, your last name, your address, your IP address (only Cloudflare's edge IP), your trial outcomes, your community-submitted notes, other babies' data.

Anthropic's terms specify that API inputs are not used to train Claude models. Bottlewise has additionally requested zero-data-retention on this API endpoint. If you do not want this to happen, narration falls back to a deterministic templated version automatically — see your settings.

## 9. Children's information

Bottlewise is **for parents and guardians**. Our service is not directed to children under 13. We do not collect information directly from children. We collect information **about** infants and toddlers, **from** their parents. If you are not the parent or legal guardian of the baby whose profile you are creating, please stop using Bottlewise.

We do not knowingly collect information from a child under 13. If you believe a child has provided information to us directly, email privacy@bottlewise.app and we will delete it.

## 10. Your rights

You have the right to:

- **Access** — see everything Bottlewise has stored about you and your baby. Today this is everything in your local storage; once sign-in is enabled, also everything in your row in Supabase.
- **Correct** — change any field at any time through the Bottlewise app.
- **Delete** — remove your account and all associated data through Settings → Delete my account. See § 11.
- **Export** — receive a copy of your data in machine-readable JSON. Email privacy@bottlewise.app for a copy; we will respond within 30 days.
- **Withdraw consent for community contribution** — change any past trial outcome's visibility to "Private" at any time.
- **Object to processing** — stop using Bottlewise and delete your account; we cannot process what we don't have.

If you are a resident of California, the EU, the UK, or another jurisdiction with specific privacy rights (CPRA, GDPR, UK GDPR), the rights above apply to you. We do not sell personal information.

## 11. Account deletion

In-app: Settings → **Delete my account**. The deletion is immediate:

1. All baby profile data is wiped from your device.
2. All trial outcomes you logged are wiped from your device.
3. All recommendations you saw are wiped from your device.
4. Once sign-in is enabled: all rows under your user ID in Supabase are deleted within 24 hours.
5. Community contributions you submitted with "Anonymous" or "First name" consent **remain** in the public dataset because they have no identifier tied back to you. If you want a specific submission removed, email privacy@bottlewise.app with the submission ID.

You can also email privacy@bottlewise.app and we will delete on your behalf.

## 12. Security

- Communication between your device and Bottlewise's servers uses TLS 1.2+.
- Supabase row-level security restricts read/write to your own rows.
- The Anthropic API key is stored server-side (Cloudflare secrets) and never enters your device's bundle.
- No data leaves your device unencrypted.
- We will notify you within 72 hours of any breach that affects your data.

## 13. Data retention

- Your baby profile is retained until you delete your account or stop using Bottlewise for 24 months, whichever is first.
- Trial outcomes are retained until you delete your account.
- Anonymous community contributions are retained indefinitely — they are not tied back to you.
- Recommendation snapshots are retained for 18 months (so we can audit engine quality over time), then anonymized.
- Server logs are retained for 90 days.

## 14. International transfers

Bottlewise's servers are in the United States. If you are outside the US, your data will be transferred to and processed in the US. We rely on standard contractual clauses for cross-border data flows.

## 15. Changes to this policy

We will post material changes here and notify you in-app. Continued use of Bottlewise after a material change constitutes acceptance of the new policy. The effective date at the top reflects the current version.

## 16. Contact

- **Privacy questions:** privacy@bottlewise.app
- **Data export / deletion requests:** privacy@bottlewise.app
- **Mailing address:** [On file with whoever submits to the App Store and Play Store; not published publicly to reduce inbox spam.]
