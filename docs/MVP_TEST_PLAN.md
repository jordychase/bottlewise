# Bottlewise — beta tester walkthrough

**The product:** https://jordychase.github.io/bottlewise/app/
**Time to complete:** ~10 minutes
**Feedback path:** in-app "Beta feedback" button (lower right) — or email feedback@bottlewise.app

---

## What we're asking you

You're going to walk through a simulated decision: your baby is on Bobbie Original Infant Formula. Bobbie just went out of stock. Bottlewise should help you find the closest available alternative, switch to it, and then watch for Bobbie to come back. Along the way you'll see ingredient analysis, ordering math, dispenser-calibration settings, and a community of other parents.

We want **specific, honest reactions** — not a thumbs-up review. If something is confusing, say so. If something is missing, say so. If a number looks wrong, say so. The Beta feedback button lets you send a note inline, with the route + your demo profile context attached automatically.

You do not need to create an account. The demo profile is a 3-month-old named Maya with family eczema, on Bobbie Original. You can change any of this in Settings.

---

## The 10-minute walkthrough

### 1. Welcome screen — first impression

Open https://jordychase.github.io/bottlewise/app/

What you should see: a first-launch modal saying "Bottlewise is decision-support, not medical advice." Read the three paragraphs. Tap **I understand — continue**.

Behind the modal: a card showing "MAYA IS ON Bobbie Original Infant Formula," then a "What do you want to do?" section with two actions, then a "Privacy · Terms · Settings" footer.

**What we want to know:**
- Did the disclosure modal feel reassuring or scary?
- Is "Maya" landing as a name that feels like a real baby, or generic?
- Are the action labels clear?

### 2. Open Bobbie's detail page

Tap the Bobbie card.

You'll land on a long page with seven sections:
- **A note for Maya** — short, personalized prose (today this is templated; real Claude narration ships when we set ANTHROPIC_API_KEY)
- **Bottlewise Ingredient Score** — Bobbie scores A 100/100
- **What's working for you** — sourced positives (organic, lactose primary, no palm oil)
- **Full ingredient list** — every line of the printed panel
- **Calibration card** — instructions for hand-measuring (or your dispenser if you set one)
- **If this isn't working** — sage card pointing at the substitution flow
- **Quantity suggester** — "How much should I order?" with daily intake, supply duration, buffer
- **Community experiences** — what other parents reported, plus "Share what happened for Maya"

**What we want to know:**
- Did any section feel like marketing? They shouldn't.
- The verdict line ("Cleaner-than-average panel...") — is that the right confidence level?
- The "Picked because" reasons — are they specific enough?
- The quantity suggester — would you actually use this?
- Anything missing you'd expect to see?

### 3. Switch to a different formula because Bobbie is out of stock

Tap **Find next closest** (or hit the "Find an alternative" card on the Welcome screen).

You'll see three matches with match-score, eyebrow ("Closest available," "Same protein form match," etc.), checkmarks for what matches, and dots for what differs.

Tap one of the matches. A modal asks two questions:
- **Watch Bobbie for restock?** Should be ON by default since the reason is out-of-stock.
- **Permanent switch?** Should be OFF — this is a stopgap.

Confirm. You'll land on the substitute's detail page.

**What we want to know:**
- The match reasons — do they make sense for THIS substitute being recommended?
- The modal copy — is the choice between "watch" and "permanent" clear?
- Did anything feel like the algorithm was guessing?

### 4. Come back to Welcome — see the watching state

Tap the Bottlewise wordmark or use your back button to return to `/`.

The Welcome screen should now show:
- Two cards: "MAYA IS ON [your substitute]" and "WATCHING FOR RESTOCK · Bobbie Original Infant Formula · Still out of stock — watching"
- A dashed honey "Demo: simulate Bobbie back in stock" button

**Tap the demo button.**

The screen should immediately surface a sage "BACK IN STOCK / Bobbie is available again." banner with two CTAs:
- **Switch back to Bobbie**
- **Stay with [your substitute]**

**What we want to know:**
- This is the "killer feature" — the thing that would have mattered most in 2022. Does it feel that way?
- The banner copy — does the cautionary "ramp over 2-3 days" feel right or like a hedge?

### 5. Read a recall — the safety surface

Go to `/troubleshoot` and search "acme demo." Tap the result (it has a red border + red "Active recall" chip).

You should see a terracotta-red banner: "ACTIVE RECALL · CLASS I" with the demo formula's recall details, a "Call my pediatrician" CTA (danger red), "Show me alternatives," and a softer "I've already spoken to my pediatrician."

Tap **Show me alternatives**. You'll land on the substitution flow with a recall-context header.

**What we want to know:**
- The safety banner — calm but unmistakable?
- The CTA hierarchy — is "Call my pediatrician" obvious as the first action?

### 6. Reach a recommendation cold

Tap **Settings** (Welcome footer) → **Delete everything** → confirm twice.

You'll land back on Welcome in the fresh-user state. Tap **New to formula** → walk through `/intake` (prep method + issues) → tap **Continue**.

You'll see `/recommendations` with three picks rendered by the actual recommendation engine — not a hand-picked demo. The "Picked because" lines explain why each one was selected against the profile you just gave us.

**What we want to know:**
- Did the intake feel intrusive? Too short? Too long?
- Are the three picks plausible alternatives, or do they seem random?
- Does "Picked because: …" explain the choice well enough to act on?

### 7. Send beta feedback

Tap the sage **Beta feedback** button (lower right, every screen). Pick a category. Write one sentence about what surprised you most. Hit send.

The mailto opens with everything pre-filled. Just hit send in your email client.

---

## Specific things we'd love a tester to try and report on

- **Searching colloquially.** Try "orange similac," "the purple can," "WIC formula," "Dutch HiPP." Does Bottlewise find the right thing?
- **The ingredient review for a generic formula.** Try Parent's Choice Advantage. Does the grade feel fair?
- **The cost calculator.** Set baby age to 7 months in Settings, then go back to a formula's detail page. Does the daily intake default change appropriately?
- **The community experiences.** Tap "Report" on a non-self experience. Does the reasons list cover the cases you'd want to flag?
- **Reset the profile.** Settings → Delete everything → does the app return to a true fresh-user state, or does it remember things you'd expect to be gone?

---

## What we are NOT testing yet

- Account creation / sign-in (intentionally not in this beta — localStorage only)
- Real stock signals from Amazon / Walmart / Target (simulated for demo)
- Real Claude narration ("Templated" chip on the "A note for Maya" surface — switches to "Personalized" once the worker is deployed)
- Push notifications
- Sharing recommendations to friends
- Affiliate links to purchase
- iOS / Android native apps (this is the web preview; native ships after web is validated)

If you have feedback on any of those, send it anyway — the engineering plan accounts for them, and your priorities help us order the work.

---

## How to send your feedback

**Primary:** the in-app **Beta feedback** button (lower right, every screen). Categorize, write, send. The route you're on and a sanitized snapshot of your demo profile are attached automatically so the build team can reproduce.

**Backup:** email **feedback@bottlewise.app** directly. Mention which screen you were on.

**Edge case:** if you find a real bug, screenshot it. Browsers, mail clients, and clipboards all vary.

---

## Thanks

Every note is read within 48 hours by the person building this. Brutal honesty is welcomed — Bottlewise is for parents at 2am, and 2am is not where polite product feedback comes from.

— Jordan, Bottlewise
