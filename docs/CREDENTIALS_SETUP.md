# Credentials Setup

Step-by-step runbook for getting the retailer-API credentials Bottlewise needs to activate the 10 private-label brands (Parent's Choice, Up & Up, Kirkland, Mama Bear, Berkley Jensen, Tippy Toes, CVS, HEB, Comforts, Member's Mark). The brand-DTC scrapers and FDA / openFDA adapters don't need any credentials.

Three vendors, in **ascending order of difficulty** — do them in this order.

| Vendor | Difficulty | Wallclock | Result |
|---|---|---|---|
| Target RedSky | None | 0 minutes | Works out of the box; nothing to do unless the public visitor key rotates |
| Walmart Affiliate API | Medium — needs a website + signed keypair | 1–3 business days | Real live data for Walmart's private-label brands |
| Amazon Product Advertising API 5.0 | Hard — Amazon Associates first, then PA-API gated on sales | 1–7 days + ongoing | Real live data for Amazon's catalog including Mama Bear, Kirkland (via Amazon listings), and cross-reference for premium DTC |

---

## Step 0 — Set up the env file

```bash
cd packages/db
cp .env.example .env
```

Open `.env`. Leave keys blank for now. Check that the rest of the tool chain reads them:

```bash
pnpm --filter @bottlewise/db run creds:check
```

You should see:

```
· Amazon PA-API          Need AMAZON_PA_ACCESS_KEY + AMAZON_PA_SECRET_KEY + AMAZON_PA_ASSOCIATE_TAG
· Walmart Affiliate      Need WALMART_CONSUMER_ID
✓ Target RedSky          Using built-in default — works without env
· Supabase (server)      Optional for read-only adapter runs. Required for --db writes + merge.
```

Add `.env` to `.gitignore` if it isn't already (it is — `packages/db/.env` is covered by the root `.gitignore`'s `.env` rule).

---

## Step 1 — Target RedSky (no signup)

Target works without credentials via the public RedSky aggregation endpoint. Verify with:

```bash
pnpm --filter @bottlewise/db run seed:validate --brand=up-and-up
```

Expect: `✓ up-and-up  retailer_api  target: 1 result(s)` (or more).

**If you get an HTTP 401/403 or zero results**, Target has rotated the public visitor key. Grab a fresh one by visiting target.com in a browser, opening DevTools → Network → search for any `redsky.target.com` call, copy the `key` query param. Drop it into `.env`:

```
TARGET_REDSKY_VISITOR_KEY=<the-fresh-key>
```

Run the validate again. You should see results.

---

## Step 2 — Walmart Affiliate API

Walmart Affiliate is the easiest of the two paid-API surfaces. Approval typically clears in 1–3 business days. The friction is generating an RSA keypair and uploading the public half.

### 2a. Apply for the Affiliate program

1. Go to **https://developer.walmart.com/affiliateLogin** and sign in / create an account.
2. Enroll in the Affiliate program — they ask for:
   - **Website URL**: `https://jordychase.github.io/bottlewise/` works as a real public site
   - **How will you use the API?**: be specific. Example copy:
     > Bottlewise is an AI formula concierge that helps parents find infant formula based on baby profile, budget, and stock availability. We use the Affiliate Search API to surface accurate, current pricing and availability for Walmart-exclusive private-label formulas (Parent's Choice line) which are critical for WIC-eligible families. Affiliate links are clearly disclosed per FTC guidelines.
   - **Expected traffic**: estimate honestly; under 10k visits/month is fine for approval.
   - **Geographic focus**: US.
3. Submit. You'll typically hear back in 24–72 hours.

### 2b. Generate your keypair

Once approved (or even before, to save a step), run:

```bash
scripts/gen-walmart-key.sh
```

This writes to `./walmart-keys/`:
- `walmart_private.pem` — keep secret
- `walmart_public.pem` — upload to Walmart
- `walmart_private_env_line.txt` — the single-line env form ready to paste

### 2c. Upload public key + grab consumer ID

1. In the Walmart developer dashboard → **My Account** → **Keys** → **Add a key**.
2. Paste the contents of `walmart_public.pem` (the whole PEM including `-----BEGIN PUBLIC KEY-----` lines).
3. Save. They'll give you a **Consumer ID** and a **Key Version** (usually `1` for your first key).

### 2d. Wire env

Open `packages/db/.env` and paste:

```
WALMART_CONSUMER_ID=<your-consumer-id>
WALMART_PRIVATE_KEY="<paste contents of walmart_private_env_line.txt>"
WALMART_PRIVATE_KEY_VERSION=1
```

### 2e. Verify

```bash
pnpm --filter @bottlewise/db run creds:check
# expect: ✓ Walmart Affiliate    Consumer …xxxxxx, key OK, version 1

pnpm --filter @bottlewise/db run seed:validate --brand=parents-choice
# expect: ✓ parents-choice   retailer_api    walmart: 1+ result(s)
```

### 2f. Lock the keys away

Once verified:
1. Move `walmart_private.pem` and `walmart_private_env_line.txt` to your secrets vault (1Password, AWS Secrets Manager, doppler — whatever you use).
2. Delete the local `walmart-keys/` directory.
3. Add `.env` to your secrets vault too (the line-encoded form is in there).

---

## Step 3 — Amazon Product Advertising API

This is the gated one. Amazon tightened PA-API access after years of abuse. Expect: easy to get an Associates account, harder to get PA-API access (requires three qualifying sales within 180 days of approval, or recurring traffic against the public Associates Storefront).

### 3a. Apply for Amazon Associates

1. Go to **https://affiliate-program.amazon.com/** → **Sign Up**.
2. Sign in with your existing Amazon account or create a new one. Use a personal Amazon account; business accounts have extra steps.
3. Fill out the application:
   - **Account info**: legal name + address
   - **Websites and apps**: add `https://jordychase.github.io/bottlewise/`
   - **Mobile apps**: leave blank for now (you can add iOS/Android bundles when the wrapper ships)
   - **Store ID**: pick something descriptive — `bottlewise-20` style. Amazon adds the `-20`. This is your **Associate Tag**.
   - **Topics, traffic-driving methods, monthly visitors**: be honest. Under 1k visitors/month is fine for the initial accept.
   - **Tax info**: US tax interview. W-9 if you're a US person.
   - **Payment info**: optional at signup; required before any payouts.
4. Submit. Approval is immediate for the Associates account.

### 3b. Apply for PA-API access

This is the step Amazon gates.

1. In Associate Central → **Tools** → **Product Advertising API** → **Get Started**.
2. You'll see one of two things:
   - **"You don't have access to PA-API yet"** — Amazon now requires three qualifying sales within 180 days of approval to KEEP API access, and effectively requires some traffic to GET initial access. Drive a few clicks via your existing public site first (the Bottlewise Pages site counts), then come back. If you're already past 180 days without sales, your access will be revoked.
   - **"Manage Your Credentials"** — you're approved. Generate an access key.
3. Click **Add Credentials** → **Show Secret Key** once. Save both keys immediately — Amazon won't show the secret again.

### 3c. Wire env

Open `packages/db/.env`:

```
AMAZON_PA_ACCESS_KEY=<your-access-key>
AMAZON_PA_SECRET_KEY=<your-secret-key>
AMAZON_PA_ASSOCIATE_TAG=bottlewise-20
AMAZON_PA_MARKETPLACE=www.amazon.com
```

### 3d. Verify

```bash
pnpm --filter @bottlewise/db run creds:check
# expect: ✓ Amazon PA-API        Associate tag bottlewise-20, key …xxxx

pnpm --filter @bottlewise/db run seed:validate --brand=mama-bear
# expect: ✓ mama-bear  retailer_api  amazon: 1+ result(s)
```

### 3e. If PA-API is denied

Two backstops while you build qualifying sales:

1. **Manual catalog seeding.** For the private-label brands, transcribe a small catalog from public Amazon listings into `packages/db/src/sources/seed/amazon-manual.json` and load it via a one-off migration. Honest, low-risk. The Tier D adapter swaps in when PA-API approval lands.
2. **Partnership path.** Reach out to Perrigo (manufactures most private-label formulas) directly — Bottlewise's brand-engagement model gives you a real ask: "we're surfacing your store-brand SKUs to budget-conscious parents at the moment of decision; please give us a price feed."

Don't fall back to scraping Amazon's product pages directly — Amazon explicitly forbids that in TOS for non-Associates and they detect it. PA-API is the only sanctioned path.

---

## Step 4 — Supabase service role (when ready to write)

Only needed when you want adapter output to flow into `source_records` + `source_runs` instead of staging JSON files.

1. Apply the migrations: `supabase db reset` (local) or `supabase db push` (remote).
2. Project dashboard → **Settings** → **API** → **Service role**. Copy the URL and the long `service_role` JWT.
3. Wire env:

```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...   # NEVER expose to client
```

4. Verify:

```bash
pnpm --filter @bottlewise/db run creds:check
# expect: ✓ Supabase (server)   https://…  service-role …xxxx

pnpm --filter @bottlewise/db run seed -- --brand=bobbie --db
# expect: rows written to source_records
```

---

## End-to-end check after all creds are in

```bash
# All four checks light up
pnpm --filter @bottlewise/db run creds:check

# Sweep every private-label brand — should be 0 fails, 0 skips
pnpm --filter @bottlewise/db run seed:validate --segment=private_label

# One real run that writes to source_records
pnpm --filter @bottlewise/db run seed -- --segment=private_label --db

# Canonical merge → formulas + formula_ingredients in Postgres
pnpm --filter @bottlewise/db run merge
```

Append the validation outcome to `docs/VALIDATION_LOG.md` so the audit trail stays current.

---

## Common failure modes

**Walmart returns 401 "Invalid signature"**
You almost certainly pasted the private key with the literal `\n` characters not escaped properly. Either:
- Use the `walmart_private_env_line.txt` form exactly as the keygen script wrote it (quoted, with `\n` escapes); OR
- Use a multi-line value in `.env` with quoted block — both `tsx --env-file` and dotenv-style loaders accept it.

**Amazon returns 503 with "TooManyRequests"**
PA-API has a baseline of 1 request/second/account that scales with monthly earned commissions. Brand-new accounts get the lowest tier. The runner's polite-HTTP layer already rate-limits per-origin to 5s; for Amazon specifically, override with `AMAZON_PA_RATE_LIMIT_MS=5000` (the adapter respects this if set). If you hit 503 consistently, you're either above quota or your access was revoked for inactivity.

**Target RedSky returns HTML, not JSON**
Target moved the visitor key. Refresh per Step 1 above.

**Supabase says "JWT expired"**
You pasted the anon key, not the service role key. Anon can't write to `source_records` because RLS isn't permissive there. Use the long `service_role` JWT.
