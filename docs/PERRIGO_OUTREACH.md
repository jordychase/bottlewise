# Perrigo Outreach — ready-to-send draft

Perrigo Nutritionals manufactures the majority of US private-label infant formula on the market today (Parent's Choice, Up & Up, Member's Mark, Kirkland Signature, Mama Bear, Berkley Jensen, Tippy Toes, Comforts, CVS Health, HEB Baby — most of the ~10 store brands in the Bottlewise registry).

For Bottlewise's brand-engaged business model, Perrigo is the single highest-leverage conversation in the private-label segment. One agreement covers the WIC-eligible parents Bottlewise is built to serve.

This is the email to send when (a) Amazon PA-API access is denied or delayed, or (b) you want a higher-fidelity data source for store-brand SKUs than retailer search APIs can give. It is *also* a real partnership pitch on its own merits — Perrigo's store-brand business has limited consumer-facing presence; Bottlewise puts their SKUs at the moment of decision.

---

## Who to send it to

The target is **Perrigo Nutritionals business development / store-brand sales lead**. Two paths:

1. **Direct LinkedIn**. Search "Perrigo Nutritionals" + "Business Development" or "Store Brand Sales." Aim for VP or Director level on the infant nutrition side. As of writing the org reports into Perrigo's CSCA (Consumer Self-Care Americas) segment.
2. **Cold to corporate**. `nutritionalsbd@perrigo.com` is a published BD inbox. Slower but a real channel.

If you have a mutual via a pediatric-nutrition contact, a pharma supplier, or a Walmart/Target buyer, prefer the warm intro and skip the cold email.

---

## Subject line options

Use one of these. The first is best.

- `Bottlewise — putting your store-brand SKUs in front of the right parents`
- `Bottlewise — partnership ask for the store-brand infant formula channel`
- `WIC-budget formula matching — would value 15 minutes`

---

## Body — copy this

> Hi [name],
>
> I'm Jordan, building **Bottlewise** — an AI formula concierge for parents of formula-fed babies that matches a baby's profile (age, family allergy history, sensitivities, budget) against a curated formula knowledge base and surfaces the three closest matches with reasons, transparent cost, and real-time stock. Live at https://jordychase.github.io/bottlewise/ — feel free to click through; the design and the ingredient review are real.
>
> The ask is short. We're a brand-engaged platform — every formula in our index gets equal visibility based on baby fit, not paid placement. **Today, the 10 Perrigo-manufactured store brands in our index** (Parent's Choice, Up & Up, Member's Mark, Kirkland Signature, Mama Bear, Berkley Jensen, Tippy Toes, Comforts, CVS Health, HEB Baby) **render with placeholder data** because we don't have an authoritative product feed for them. WIC-eligible families are a large share of our audience and these store brands are exactly what they need surfaced first.
>
> What would unblock us:
>
> - A structured product feed (SKU, ingredient list, nutrition panel, package sizes, MSRP, GTIN/UPC) for the Perrigo store-brand lines we carry. CSV monthly is fine; an API endpoint is ideal.
> - Confirmation of which retailer SKUs map to which Perrigo product — store brands share recipes across chains and the mapping is non-public.
>
> In exchange:
>
> - Every recommendation for an eligible baby surfaces the matching store-brand SKU(s) alongside national brands, with the cost-per-ounce advantage shown plainly.
> - You'd see usage telemetry — how often each SKU surfaces, gets clicked into detail view, gets added to a parent's trial list — under a separate data agreement.
> - The architecture is open source ([github.com/jordychase/bottlewise](https://github.com/jordychase/bottlewise)) and the recommendation algorithm is auditable. No black box.
>
> Bottlewise is positioned as decision support, not medical advice; every recommendation surface includes "talk to your pediatrician" framing and our safety pipeline routes allergic-reaction language to a pediatrician interstitial before any formula content shows. We're not asking you to underwrite claims about your products — only to make sure parents who'd benefit from them can find them at the moment of decision.
>
> 15 minutes by phone if there's interest? Happy to share the technical spec, the ingredient-review methodology, or any commercial terms in advance.
>
> Best,
> Jordan
> https://jordychase.github.io/bottlewise/

---

## Why this email works

1. **It names a real, specific problem they can solve.** Most cold pitches to Perrigo are agencies selling marketing services. This is an asymmetric ask — we can do something for their store-brand channel that they can't do themselves (consumer-facing visibility at the decision moment).
2. **It demonstrates we're real before asking for anything.** The live URL, the public GitHub, the design system all do work in the first paragraph. Perrigo's BD team can verify in 30 seconds we're not vapor.
3. **It pre-answers their two big objections.**
   - "Are you making claims about our products?" → No. Decision support, not medical advice. Spelled out.
   - "Will this commoditize us against national brands?" → Opposite. Today we render the national brands richly and the store brands as placeholders. The feed *closes the gap.*
4. **The ask is concrete.** SKU + ingredients + nutrition + sizes + price + UPC. Not "a partnership." Not "let's brainstorm." A specific feed.
5. **The give is concrete.** Surface telemetry, plus the open-source posture as social proof. Perrigo's analytics team can quote this internally.

## What to expect

- **Best case**: routed to their digital / e-commerce lead within a week. A discovery call. Possibly an NDA before they share a feed. Allow 6–10 weeks from email to first feed delivered.
- **Likely case**: a polite "thanks, we'll keep this on file" response, then nothing. Send a 4-week follow-up. Perrigo's BD inbox is noisy; second touches surface real interest.
- **Worst case**: no response after two attempts. Pivot to direct retailer partnerships (Walmart's private-label team, Costco's Kirkland team) one at a time. Slower, narrower, but each covers a real share of the WIC audience.

## Send-day checklist

- [ ] Bottlewise URL loads cleanly (`pnpm seed:list` outputs 47 brands; the live `/app/` renders the recommendation flow)
- [ ] Public GitHub README leads with the one-line value prop, not technical details
- [ ] You can quote the source for any specific claim in the email (especially the WIC point — cite "USDA WIC monthly participation data" if asked)
- [ ] Personal LinkedIn / company contact info matches the email signature
- [ ] You have a 15-minute slot open for the next two weeks if they reply same-day
