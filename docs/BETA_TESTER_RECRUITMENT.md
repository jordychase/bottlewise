# Beta tester recruitment

Bottlewise's audience is sleep-deprived parents of formula-fed babies. The richest signal in a beta comes from parents currently making this decision — not from product designers, not from your network of formerly-pregnant friends. Aim for **10–15 testers in the first wave**, weighted toward parents in the first 9 months postpartum.

---

## Who we want (in priority order)

1. **Parents currently on formula** with a baby 0–9 months. This is the killer cohort. They'll catch every detail we got wrong.
2. **Parents who switched formulas in the last 12 months.** Memory is fresh enough that they'll react accurately to the substitution flow.
3. **Parents who experienced the 2022 shortage.** They will viscerally evaluate the restock-monitoring surface against a real lived experience.
4. **WIC-eligible parents.** Bottlewise leans into store-brand visibility; their feedback on whether Parent's Choice / Up & Up presentation feels respectful (not condescending) is critical.
5. **Pediatricians and pediatric nurses.** One or two is enough; they're a calibration check on whether the safety framing reads as appropriate to clinical readers.

## Who we don't want yet

- **Designers / engineers / VCs.** Their reaction is on craft, not on whether the product solves the actual problem at 2am. Defer to round 2.
- **Parents whose kids are over 18 months.** Memory is too far gone; they'll fill in gaps with what they wish they'd had instead of how they actually felt.
- **Single-formula loyalists who never considered switching.** They've already done the decision work; Bottlewise doesn't help them.

---

## Recruitment channels — what works

### Highest yield

**Direct outreach to specific people you know.** Five well-chosen acquaintances beats fifty strangers. Personal note: "you went through this decision recently; I'd value 10 minutes of your reaction to a tool I built that would have helped you. Here's the link." No expectation, just an ask.

**r/FormulaFeeders on Reddit.** ~80k members, active, the right cohort. Post in their weekly thread (do NOT make a top-level marketing post — mods will remove). Lead with the 2022 crisis hook and the WIC-budget angle:

> Hey r/FormulaFeeders — I built a small tool that's trying to be the "find the next closest available formula" feature we all needed in 2022, plus an ingredient-score grading thing like Yuka but specifically for infant formula. It's a free web demo, no signup, ~10 minutes to walk through. Specifically looking for parents currently formula-feeding who'd be willing to send a paragraph of honest reaction. Link in the comments if there's interest.

If a mod gives the green light, run the link in a top-level post with a `[FEEDBACK]` flair.

**Bottlewise's existing audience.** If Jordan has any newsletter, Twitter, LinkedIn, or Substack audience of parents, this is by far the warmest channel.

### Medium yield

**Pediatric nutrition Facebook groups.** Privacy-conscious — most won't allow links. Same wording as Reddit, ask the admin first. Examples: "Formula Feeding Support Group," "Breast and Bottle Feeding Mommies," "FedIsBest" community.

**Pediatrician office front-desk staff.** Some pediatric practices have a "feeding questions" knowledge base. Asking the front-desk lead if they'd be willing to share a beta link with parents asking formula questions sometimes works, especially in independent practices.

**Local parenting Slacks.** Most US cities have a "[Cityname] Parents" Slack or Discord. Ask first — these tend to ban marketing — but framing this as "free tool, looking for honest feedback, no email signup required" usually clears.

### Low yield (skip)

**Paid social ads.** Too expensive for too generic a respondent at this stage. Costs $30+ per intercept; you can get a better signal from 5 personal asks.

**Cold influencer outreach.** Parenting influencers want exclusivity and / or money. Save this for launch, not beta.

**Reddit r/Parenting.** Too broad. Engagement skews toward debates rather than feedback.

---

## What to send (template)

Email subject: *Bottlewise beta — 10 minutes of your honest reaction*

Body:

> Hi [name],
>
> Quick ask — I've been building a tool called Bottlewise. It's a calmer way to find an infant formula that fits your baby, with a real "find the next closest available" feature (the thing we all needed in 2022) and an ingredient-score grade for every formula based on cited research.
>
> It's free, web-only for now, no signup needed. Walkthrough takes about 10 minutes. There's a "Beta feedback" button on every screen so you can fire off reactions inline — they go straight to me.
>
> Link: https://jordychase.github.io/bottlewise/app/
> Walkthrough guide (worth a skim first): https://github.com/jordychase/bottlewise/blob/main/docs/MVP_TEST_PLAN.md
>
> I'd value brutal honesty over polite enthusiasm. Specifically: where did you get confused, what did you wish it did, what's missing.
>
> No reply needed if you don't have time — but if you do, I read every note within 48 hours.
>
> Thanks,
> Jordan

---

## What to do with the responses

**Triage every 24h.** For each note:
- Bug → file an issue in github.com/jordychase/bottlewise/issues with the route + repro context
- Confusion → tag with the screen name; clusters of 2+ on the same screen = priority UX fix
- Missing feature → tag with the feature name; cross-reference against the PRD § 9 Open Decisions before adding to the roadmap
- General positive → file with the tester's permission as a testimonial draft for the App Store listing

**Reply within 48h.** Even a one-liner — "got it, thanks, this maps to a fix I'm planning." Beta testers who feel heard send more notes. Beta testers who feel ignored disappear.

**Aggregate weekly.** Friday-afternoon write-up to yourself: top 3 things multiple testers said, top 3 things one tester said that made you reconsider, top 3 things you decided not to act on (and why).

---

## Sample size + duration

- **First wave:** 10–15 testers, 7 days.
- **Decision gate after first wave:** are any of the major issues showstoppers? If yes, fix before wave 2. If no, scale to 30–50 in wave 2 (still parents of <9-month-olds).
- **Scale to public beta** (no tester recruitment, just the public URL with the beta-feedback button) only after the killer-feature surfaces (recommendation, substitution, restock) have positive sentiment from 80%+ of testers.

You will NOT get statistical significance from this. You're looking for surprise, friction, and joy — qualitative data.

---

## When to stop using the beta-feedback button

When the same three pieces of feedback have arrived three times each from three different testers, you've heard the signal. Stop and act. Re-open the button after the fixes ship.
