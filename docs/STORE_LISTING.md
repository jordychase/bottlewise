# App Store + Play Store listing reference

Paste-ready answers for the two store submission flows. Keep this doc in sync with the Privacy Policy and Terms of Service — when one changes, audit the others.

---

## App description (both stores)

### Short description (Play Store · 80 chars)

```
AI formula concierge for parents. Decision-support, not medical advice.
```

### Long description / "About this app"

```
Bottlewise is the calmest place to make the most stressful decision of new parenthood: which formula is right for your baby, right now.

What Bottlewise does:

• Three personalized formula picks based on your baby's age, family allergy history, sensitivities, and budget — with reasons.

• Bottlewise Ingredient Score (A–F) for every formula, with cited concerns and what's working for you. Every flag is sourced — AAP guidance, EU regulations, peer-reviewed research.

• "Find next closest" — when your formula is out of stock, find the closest available alternative with the same protein profile. The substitution we needed in 2022.

• Restock monitoring — switch to an alternative, and Bottlewise watches for your original to come back. The moment it does, decide on the spot: switch back or stay.

• Cost transparency including landed cost with tariffs for European imports.

• Bottle preparation calibration for Baby Brezza, Tommee Tippee Perfect Prep, and Dr. Brown's Insta-Feed.

• Community experiences from other parents — anonymized by default, fully under your control.

• Recall alerts via openFDA. Active recalls automatically exclude affected formulas from any recommendation.

Bottlewise is decision-support, not medical advice. Every recommendation includes "talk to your pediatrician" framing. Safety triggers route to a pediatrician consult before any formula content is shown. Always confirm with your pediatrician before any feeding change.

For parents of babies on Bobbie, ByHeart, Kendamil, HiPP, Holle, Parent's Choice, Up & Up, Similac, Enfamil, Gerber, Earth's Best, Nutramigen, Alimentum, EleCare, Neocate, Kabrita, and 30+ other brands across mass-market, store-brand (WIC-eligible), premium DTC, European import, hypoallergenic, amino-acid elemental, preemie, goat-milk, and A2 categories.

Open source. The recommendation algorithm, similarity engine, and ingredient-score methodology are public and auditable at github.com/jordychase/bottlewise.
```

### What's new (per release)

Pattern: "[Major feature]. Plus [smaller item], [smaller item]."

---

## Categories

| Field | Apple App Store | Google Play |
|---|---|---|
| Primary | Health & Fitness | Parenting |
| Secondary | Lifestyle | Health & Fitness |

**Do NOT** use the "Kids" category. Bottlewise is **for parents about babies**, not for children. Using the Kids category triggers extra compliance (COPPA / Designed for Families) that we do not need.

---

## Age rating

| Field | Value |
|---|---|
| Apple App Store | **4+** |
| Google Play | **Everyone** (no IARC questionnaire item triggers a higher rating) |

---

## Privacy Nutrition Labels (Apple App Store Connect)

When prompted "Do you or your third-party partners collect data from this app?" answer **Yes**, then:

### Data Linked to You

| Category | Type | Purpose | Why |
|---|---|---|---|
| Health & Fitness | Health | App Functionality | Baby DOB, family allergy flags, observed feeding issues — drive matching |
| Contact Info | Email Address | App Functionality, Account Management | Sign-in (when enabled) |
| User Content | Customer Support | App Functionality | Community Experience submissions and Report submissions |
| Identifiers | User ID | App Functionality | Account row identifier |
| Usage Data | Product Interaction | Analytics, App Functionality | Recommendation snapshots, substitution events |

### Data Not Linked to You

| Category | Type | Purpose |
|---|---|---|
| Diagnostics | Crash Data, Performance Data | App Functionality |

### NOT collected

- Location (precise) — answer NO. We only ask for ZIP code optionally, which is **coarse location**.
- Financial Info — NO.
- Sensitive Info — depends; some jurisdictions classify pediatric health data as sensitive. Answer based on counsel review.
- Contacts — NO.
- Photos — NO.
- Audio — NO.
- Search History, Browsing History — NO.

### Tracking

**No tracking across apps or websites owned by other companies.** Bottlewise does not use advertising identifiers and does not embed third-party trackers.

---

## Data Safety section (Google Play Console)

The Play Console form mirrors Apple's but with different categories. Use the same factual answers as above; the form labels them differently:

| Play Console category | Answer |
|---|---|
| Personal info > Name | Optional collection (baby's first name) · Account management · Required for app function · Encrypted in transit · Yes, user can delete |
| Personal info > Email address | Required when auth enabled · Account management · Encrypted in transit · Yes, deletable |
| Personal info > Other info | Family allergy flags · Account management · Required · Encrypted in transit · Yes, deletable |
| Health and fitness > Health info | Baby DOB, age, gestational age, feeding status, observed issues · App functionality · Required · Encrypted in transit · Yes, deletable |
| Financial info | NOT COLLECTED |
| Location | Approximate location (ZIP code) · Optional · App functionality · Encrypted in transit · Yes, deletable |
| Messages > User-generated content | Community Experience submissions · App functionality · Optional · Encrypted in transit · Yes, deletable |
| Photos and videos | NOT COLLECTED |
| Audio files | NOT COLLECTED |
| Files and docs | NOT COLLECTED |
| Calendar | NOT COLLECTED |
| Contacts | NOT COLLECTED |
| App activity > App interactions | Recommendation views, substitution selections · Analytics · Optional · Encrypted in transit · Yes, deletable |
| App info and performance > Crash logs | App functionality · Encrypted in transit · No (anonymized) |
| Device or other IDs | User ID · Account management · Required · Encrypted in transit · Yes, deletable |

### Security practices

- **Data is encrypted in transit:** YES (TLS 1.2+).
- **Data is encrypted at rest:** YES (Supabase Postgres at-rest encryption + Cloudflare KV / Workers KV at-rest encryption for any cached payload).
- **You can request that data be deleted:** YES (in-app Settings → Delete my account, plus email path).
- **Committed to follow the Play Families Policy:** N/A — we do not target children.

---

## Required URLs

| URL | Where it lives |
|---|---|
| Privacy Policy | https://jordychase.github.io/bottlewise/legal/privacy/ — also rendered in-app at `/legal/privacy` |
| Terms of Service | https://jordychase.github.io/bottlewise/legal/terms/ — also rendered in-app at `/legal/terms` |
| Support URL | https://jordychase.github.io/bottlewise/ (and / or a `support@bottlewise.app` mailto) |
| Marketing URL | https://jordychase.github.io/bottlewise/ |

**Both URLs must resolve before submission.** Reviewers test them.

---

## Review notes (App Store)

Paste this in the Review Notes section. Apple's reviewers are aggressive on health-adjacent apps; pre-empting their questions speeds approval.

```
Bottlewise is positioned as Tier 1 (Information & Decision-Support) per the framing in our Privacy Policy and Terms.

Bottlewise:
- Does NOT diagnose, treat, prevent, or cure any condition.
- Does NOT issue prescriptions or dosage recommendations.
- The quantity-suggester surface is an ordering helper ("how many cans to order to cover a given supply duration") backed by AAP-published intake bands. It is not a feeding-amount calculator and is framed as such.

Every recommendation surface includes a "talk to your pediatrician" disclaimer. Safety triggers (allergic-reaction mentions, severe symptoms) route to a pediatrician-consult interstitial BEFORE any formula content is shown — see app/safety/recall.tsx.

Recalls: Bottlewise consumes the openFDA Food Enforcement endpoint. Class I recalls automatically exclude affected formulas from substitution and recommendation surfaces. Verified by automated test (apps/mobile/src/lib/__tests__/similarity.test.ts).

User-generated content (Community Experiences):
- Three explicit consent levels: Private, Anonymous, First Name only.
- Every card has a Report button. Reports route to a moderation queue.
- Content rules (no medical claims, no personally identifying info) are surfaced in the submission modal and enforced by moderation.

Account deletion: in-app via Settings → Delete my account. All local and (when auth is enabled) remote data is wiped immediately.

The recommendation algorithm, similarity engine, and ingredient-score methodology are open-source at github.com/jordychase/bottlewise for full transparency. Test invariants enforce the load-bearing compliance assertions.

Demo credentials, if needed: the app works without any login at this stage. Local state seeded with a demo baby ("Maya, 3 months, family eczema flag, currently on Bobbie Original") so reviewers can immediately see every surface.
```

---

## Screenshots required

Apple wants screenshots in these aspect ratios:
- 6.7" iPhone (1290x2796): 3 or more
- 6.5" iPhone (1242x2688): can reuse 6.7 if needed
- iPad 13" if you submit iPad version (3 or more)

Recommended set, in this order:

1. Welcome with the CurrentFormulaPanel ("MAYA IS ON Bobbie Original Infant Formula")
2. Recommendations screen with three picks visible
3. Formula detail showing the ingredient score (A 100/100) with a positive
4. Substitution flow showing Parent's Choice Tender as match 100/100 for Nutramigen
5. Restock banner with "Bobbie is available again — Switch back / Stay"
6. Quantity suggester with the buffer toggle visible

Play wants 16:9 phone screenshots (1080x1920+). Reuse the same surfaces in landscape-cropped form.

---

## App Store Connect / Play Console gotchas

- **Apple wants you to identify if your app uses encryption.** Bottlewise uses standard TLS for transport and Supabase's default AES at-rest. Answer **Yes**, then "Only standard encryption" — no export compliance form needed.
- **Play Console asks if your app contains ads.** Answer **No**.
- **Play Console asks if your app has in-app purchases.** Today: **No**. When affiliate revenue is enabled, still No (affiliate links to external storefronts are not IAP). If a premium tier is added: Yes (must use Play Billing).
- **Apple wants a contact email** that the reviewer can reach during review. Use a personal email here, not a hidden alias — Apple will reject if it bounces.
- **Apple wants demo credentials** when an account is required. Today no login → not applicable. When sign-in is enabled, set up `reviewer@bottlewise.app` / a strong fixed password.
