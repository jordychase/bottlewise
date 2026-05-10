#!/usr/bin/env tsx
/**
 * Bottlewise signup copilot.
 *
 * Walks the operator through Amazon Associates + Walmart Affiliate +
 * Anthropic API key signups. Generates the application copy tailored
 * to each form, caches personal info once, copies snippets to the
 * clipboard, opens URLs, tracks progress so you can resume.
 *
 * What this tool will NOT do:
 *   - Sign a W-9 or any tax form
 *   - Enter banking details or SSN
 *   - Submit forms autonomously
 *   - Bypass captchas or anti-bot checks
 * Those are all operator actions in the operator's own browser.
 *
 * Where state lives:
 *   ~/.bottlewise-signup.local.json — operator profile + progress
 *
 * Run:
 *   pnpm signup
 *
 * The profile file is .local — never commit it. Bottlewise's
 * root .gitignore already excludes it.
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { createInterface, type Interface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const PROFILE_PATH = join(homedir(), ".bottlewise-signup.local.json");
const DEFAULT_WEBSITE = "https://jordychase.github.io/bottlewise/";

// ─── Profile types ────────────────────────────────────────────────────

interface MailingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface VendorStatus {
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

interface OperatorProfile {
  legalName: string;
  email: string;
  phone?: string;
  mailingAddress: MailingAddress;
  websiteUrl: string;
  amazonStoreId: string;
  monthlyVisitorsEstimate: string;
  status: {
    amazonAssociates?: VendorStatus & { associateTag?: string };
    amazonPaApi?: VendorStatus;
    walmartAffiliate?: VendorStatus & { consumerId?: string };
    anthropic?: VendorStatus;
  };
}

// ─── Persistence ──────────────────────────────────────────────────────

function loadProfile(): OperatorProfile | null {
  if (!existsSync(PROFILE_PATH)) return null;
  try {
    return JSON.parse(readFileSync(PROFILE_PATH, "utf8")) as OperatorProfile;
  } catch (err) {
    console.error(`Could not parse ${PROFILE_PATH}: ${(err as Error).message}`);
    return null;
  }
}

function saveProfile(profile: OperatorProfile): void {
  mkdirSync(dirname(PROFILE_PATH), { recursive: true });
  writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), { mode: 0o600 });
}

// ─── Terminal helpers ────────────────────────────────────────────────

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  sage: "\x1b[38;5;108m",
  honey: "\x1b[38;5;179m",
  danger: "\x1b[38;5;167m",
  ink2: "\x1b[38;5;243m",
};

function paint(s: string, color: keyof typeof COLORS): string {
  return `${COLORS[color]}${s}${COLORS.reset}`;
}

function rule(): void {
  console.log(paint("─".repeat(64), "ink2"));
}

function heading(s: string): void {
  console.log();
  rule();
  console.log(paint(s, "bold"));
  rule();
}

function step(n: number, total: number, label: string): void {
  console.log();
  console.log(`${paint(`Step ${n}/${total}`, "sage")} — ${paint(label, "bold")}`);
}

function note(s: string): void {
  console.log(paint(s, "ink2"));
}

function snippet(label: string, content: string): void {
  console.log();
  console.log(paint(`▸ ${label}`, "sage"));
  console.log(paint("┌" + "─".repeat(62) + "┐", "ink2"));
  const lines = content.split("\n");
  for (const line of lines) {
    console.log(paint("│ ", "ink2") + line);
  }
  console.log(paint("└" + "─".repeat(62) + "┘", "ink2"));
  copyToClipboard(content);
  console.log(paint("  (copied to clipboard)", "dim"));
}

function openUrl(url: string): void {
  try {
    const platform = process.platform;
    if (platform === "darwin") execSync(`open "${url}"`, { stdio: "ignore" });
    else if (platform === "win32") execSync(`start "" "${url}"`, { stdio: "ignore" });
    else execSync(`xdg-open "${url}"`, { stdio: "ignore" });
  } catch {
    console.log(paint(`(could not auto-open; URL: ${url})`, "danger"));
  }
}

function copyToClipboard(text: string): void {
  try {
    const platform = process.platform;
    const cmd =
      platform === "darwin"
        ? "pbcopy"
        : platform === "win32"
          ? "clip"
          : "xclip -selection clipboard";
    execSync(cmd, { input: text });
  } catch {
    // No clipboard available; silent.
  }
}

// ─── Prompts ──────────────────────────────────────────────────────────

async function ask(rl: Interface, q: string, fallback?: string): Promise<string> {
  const hint = fallback ? paint(` [${fallback}]`, "dim") : "";
  const answer = (await rl.question(`${q}${hint} ? `)).trim();
  return answer || fallback || "";
}

async function askRequired(rl: Interface, q: string, fallback?: string): Promise<string> {
  while (true) {
    const answer = await ask(rl, q, fallback);
    if (answer) return answer;
    console.log(paint("  (required)", "danger"));
  }
}

async function confirm(rl: Interface, q: string): Promise<boolean> {
  const answer = (await rl.question(`${q} (y/N) `)).trim().toLowerCase();
  return answer === "y" || answer === "yes";
}

async function pressEnter(rl: Interface, prompt = "Press Enter when done"): Promise<void> {
  await rl.question(paint(`  ${prompt} `, "dim"));
}

// ─── Profile setup ────────────────────────────────────────────────────

async function initProfile(rl: Interface): Promise<OperatorProfile> {
  heading("Initialize operator profile");
  note(`Stored at ${PROFILE_PATH} (chmod 600). Never committed.`);
  note("You'll be asked once; subsequent signups reuse the answers.");
  console.log();

  const legalName = await askRequired(rl, "Legal name");
  const email = await askRequired(rl, "Business email");
  const phone = await ask(rl, "Phone (optional)");
  console.log(paint("\nMailing address:", "sage"));
  const line1 = await askRequired(rl, "  Street address");
  const line2 = await ask(rl, "  Apt/suite (optional)");
  const city = await askRequired(rl, "  City");
  const state = await askRequired(rl, "  State / region");
  const zip = await askRequired(rl, "  Postal code");
  const country = await ask(rl, "  Country", "United States");
  console.log();
  const websiteUrl = await ask(rl, "Website URL", DEFAULT_WEBSITE);
  const amazonStoreId = await ask(rl, "Preferred Amazon store ID prefix", "bottlewise");
  const monthlyVisitorsEstimate = await ask(rl, "Monthly visitors estimate", "Under 1,000");

  const profile: OperatorProfile = {
    legalName,
    email,
    phone: phone || undefined,
    mailingAddress: { line1, line2: line2 || undefined, city, state, zip, country },
    websiteUrl,
    amazonStoreId,
    monthlyVisitorsEstimate,
    status: {},
  };
  saveProfile(profile);
  console.log();
  console.log(paint(`✓ Saved to ${PROFILE_PATH}`, "sage"));
  return profile;
}

// ─── Copy templates ───────────────────────────────────────────────────

function applicationCopy(profile: OperatorProfile, vendor: "amazon" | "walmart") {
  const longUseCase = `Bottlewise is an AI formula concierge for parents of formula-fed babies. We help families find the right infant formula based on baby profile, family allergy history, budget, and real-time stock availability. Editorial focus: pediatric nutrition, infant feeding, formula ingredient analysis, and store-brand vs national-brand cost comparison. We are positioned as decision support, not medical advice; every recommendation surface includes "talk to your pediatrician" framing.`;

  if (vendor === "amazon") {
    return {
      websites: profile.websiteUrl,
      storeIdSuggestion: profile.amazonStoreId,
      topics: `Pediatric nutrition, infant feeding, formula ingredient analysis, store-brand vs national-brand comparison, infant feeding cost tracking.`,
      trafficMethods: `SEO / organic search, direct visits from referrals, email newsletter, word of mouth. No paid acquisition at this stage.`,
      useCase: longUseCase,
      whyJoin: `Bottlewise surfaces the formula closest to a parent's baby profile and budget, with transparent per-ounce cost. Amazon's Product Advertising API is the only sanctioned way to give parents accurate, current pricing and availability for Amazon-sold formulas — particularly important for the Mama Bear private-label line and as a cross-reference for European-import brands.`,
      monthlyVisitors: profile.monthlyVisitorsEstimate,
    };
  }

  return {
    website: profile.websiteUrl,
    useCase: `${longUseCase} We use the Walmart Affiliate Search API specifically to surface accurate, current pricing and availability for Walmart-exclusive private-label formulas (Parent's Choice line), which are critical for WIC-eligible families. Affiliate links are clearly disclosed per FTC guidelines.`,
    expectedTraffic: profile.monthlyVisitorsEstimate,
    geo: "United States only",
  };
}

// ─── Amazon walk ──────────────────────────────────────────────────────

async function walkAmazon(rl: Interface, profile: OperatorProfile): Promise<void> {
  heading("Amazon Associates → Product Advertising API");
  note("Estimated wallclock: 15–25 minutes for the Associate signup.");
  note("PA-API access is gated separately; we'll start that application at the end.");
  note("You will type SSN / tax / banking info into Amazon directly. Not into this tool.");

  const copy = applicationCopy(profile, "amazon");
  profile.status.amazonAssociates ??= {};
  profile.status.amazonAssociates.startedAt ??= new Date().toISOString();
  saveProfile(profile);

  step(1, 9, "Open Amazon Associates signup");
  note("https://affiliate-program.amazon.com/");
  await pressEnter(rl, "Press Enter to open in your browser");
  openUrl("https://affiliate-program.amazon.com/");
  await pressEnter(rl, "Press Enter once you're at the signup page");

  step(2, 9, "Account info — pre-filled values to paste");
  snippet("Legal name", profile.legalName);
  await pressEnter(rl);
  snippet("Address line 1", profile.mailingAddress.line1);
  await pressEnter(rl);
  if (profile.mailingAddress.line2) {
    snippet("Address line 2", profile.mailingAddress.line2);
    await pressEnter(rl);
  }
  snippet(
    "City / State / ZIP",
    `${profile.mailingAddress.city}, ${profile.mailingAddress.state} ${profile.mailingAddress.zip}`,
  );
  await pressEnter(rl);
  if (profile.phone) {
    snippet("Phone", profile.phone);
    await pressEnter(rl);
  }

  step(3, 9, "Websites — add your site");
  snippet("Website URL", copy.websites);
  note("Mobile apps: leave blank for now. Add later when iOS/Android wrappers ship.");
  await pressEnter(rl);

  step(4, 9, "Store ID — your Associate tag");
  snippet("Store ID (Amazon appends -20)", copy.storeIdSuggestion);
  note(`Your final Associate Tag will be: ${copy.storeIdSuggestion}-20`);
  const finalTag = await ask(rl, "Confirm the final tag Amazon assigned", `${copy.storeIdSuggestion}-20`);
  profile.status.amazonAssociates!.associateTag = finalTag;
  saveProfile(profile);

  step(5, 9, "Topics — what your site is about");
  snippet("Topic description (paste into the long text field)", copy.topics);
  await pressEnter(rl);

  step(6, 9, "Traffic-driving methods");
  snippet("How do you drive traffic (paste)", copy.trafficMethods);
  await pressEnter(rl);

  step(7, 9, "Why join the Associates program");
  snippet("Use-case description (paste)", copy.useCase);
  await pressEnter(rl);
  snippet("Why this program specifically (paste)", copy.whyJoin);
  await pressEnter(rl);

  step(8, 9, "Monthly visitors + payment + tax interview");
  snippet("Monthly visitors estimate", copy.monthlyVisitors);
  await pressEnter(rl);
  note("Now Amazon walks you through:");
  note("  - phone PIN verification");
  note("  - tax interview (W-9 if US person)");
  note("  - payout method (defer if you don't have business banking yet)");
  note("Type those values directly into Amazon. They are NOT in this tool.");
  await pressEnter(rl, "Press Enter when the Associate signup is fully submitted");

  step(9, 9, "Apply for PA-API access");
  note("After Associates approval, you separately apply for PA-API.");
  note("Inside Associates Central → Tools → Product Advertising API → Get Started.");
  note("Amazon now gates initial access pending traffic. Document attempt anyway.");
  await pressEnter(rl, "Press Enter to open PA-API entry point in Associates Central");
  openUrl("https://affiliate-program.amazon.com/assoc_credentials/home");
  const paApiApplied = await confirm(rl, "Did you submit a PA-API access request?");
  if (paApiApplied) {
    profile.status.amazonPaApi = {
      startedAt: new Date().toISOString(),
      notes: "PA-API access requested; awaiting approval",
    };
  }

  profile.status.amazonAssociates!.completedAt = new Date().toISOString();
  saveProfile(profile);

  console.log();
  console.log(paint("✓ Amazon Associates signup walk complete.", "sage"));
  note("When you receive the access key + secret, paste into packages/db/.env as:");
  note("  AMAZON_PA_ACCESS_KEY=...");
  note("  AMAZON_PA_SECRET_KEY=...");
  note(`  AMAZON_PA_ASSOCIATE_TAG=${profile.status.amazonAssociates!.associateTag}`);
  note("Then run: pnpm --filter @bottlewise/db run creds:check");
}

// ─── Walmart walk ─────────────────────────────────────────────────────

async function walkWalmart(rl: Interface, profile: OperatorProfile): Promise<void> {
  heading("Walmart Affiliate API");
  note("Estimated wallclock: 10 minutes form + 1–3 days approval wait.");
  note("Easier than Amazon PA-API; lower bar for initial approval.");

  const copy = applicationCopy(profile, "walmart");
  profile.status.walmartAffiliate ??= {};
  profile.status.walmartAffiliate.startedAt ??= new Date().toISOString();
  saveProfile(profile);

  step(1, 6, "Open the Walmart developer affiliate login");
  await pressEnter(rl, "Press Enter to open");
  openUrl("https://developer.walmart.com/affiliateLogin");

  step(2, 6, "Sign in / create an account");
  note("Use your business email if you have one; personal works too.");
  snippet("Email", profile.email);
  await pressEnter(rl);

  step(3, 6, "Affiliate program enrollment — paste the application copy");
  snippet("Website URL", copy.website);
  await pressEnter(rl);
  snippet("How will you use the API (paste)", copy.useCase);
  await pressEnter(rl);
  snippet("Expected monthly traffic", copy.expectedTraffic);
  await pressEnter(rl);
  snippet("Geographic focus", copy.geo);
  await pressEnter(rl);
  note("Submit. You'll typically hear back in 24–72 hours.");
  await pressEnter(rl, "Press Enter once you've submitted");

  step(4, 6, "Generate your RSA keypair locally");
  note("Run this in another terminal (or wait if you prefer to do it after approval):");
  snippet("Keygen command", "scripts/gen-walmart-key.sh");
  await pressEnter(rl, "Press Enter once you've run the script and have the keys");

  step(5, 6, "Upload public key + grab Consumer ID");
  note("After Walmart approves, in the developer dashboard:");
  note("  My Account → Keys → Add a key → paste walmart_public.pem");
  note("Walmart returns a Consumer ID + Key Version (usually 1).");
  const consumerId = await ask(rl, "Consumer ID Walmart issued (paste here, or skip)");
  if (consumerId) profile.status.walmartAffiliate!.consumerId = consumerId;
  saveProfile(profile);

  step(6, 6, "Wire .env");
  note("Open packages/db/.env and paste:");
  snippet(
    "Env block",
    `WALMART_CONSUMER_ID=${consumerId || "<paste-here>"}\nWALMART_PRIVATE_KEY="$(<paste contents of walmart_private_env_line.txt>)"\nWALMART_PRIVATE_KEY_VERSION=1`,
  );
  await pressEnter(rl, "Press Enter when env is wired");
  note("Verify: pnpm --filter @bottlewise/db run creds:check");

  profile.status.walmartAffiliate!.completedAt = new Date().toISOString();
  saveProfile(profile);
  console.log();
  console.log(paint("✓ Walmart Affiliate signup walk complete.", "sage"));
}

// ─── Anthropic walk ───────────────────────────────────────────────────

async function walkAnthropic(rl: Interface, profile: OperatorProfile): Promise<void> {
  heading("Anthropic API key (for the narrator worker)");
  note("Estimated wallclock: 5 minutes.");
  note("Cost expectation: ~$0.0004 per narration with Haiku. Pay-as-you-go.");

  profile.status.anthropic ??= {};
  profile.status.anthropic.startedAt ??= new Date().toISOString();
  saveProfile(profile);

  step(1, 4, "Open console.anthropic.com and sign in / create account");
  await pressEnter(rl, "Press Enter to open");
  openUrl("https://console.anthropic.com/");
  await pressEnter(rl, "Press Enter once you're signed in");

  step(2, 4, "Add a payment method (required for API access)");
  note("Settings → Plans & billing → Add payment method.");
  note("Set a usage cap (Spend limits) — $20/month is plenty for early testing.");
  await pressEnter(rl);

  step(3, 4, "Create the API key");
  note("Settings → API keys → Create key.");
  note("Name it: bottlewise-narrator-worker");
  note("Copy the key — it starts with sk-ant-... and is shown ONCE.");
  await pressEnter(rl);

  step(4, 4, "Push the key into the Cloudflare Worker secret store");
  note("Run this in another terminal:");
  snippet(
    "Wrangler secret",
    "cd packages/narrator-worker && wrangler secret put ANTHROPIC_API_KEY",
  );
  note("Paste the key at the prompt. Wrangler stores it in Cloudflare's secret backend.");
  note("Verify the worker is wired:");
  snippet("Deploy command", "cd packages/narrator-worker && wrangler deploy");

  profile.status.anthropic!.completedAt = new Date().toISOString();
  saveProfile(profile);
  console.log();
  console.log(paint("✓ Anthropic key + worker wiring complete.", "sage"));
  note("Now set EXPO_PUBLIC_NARRATOR_URL in apps/mobile/.env to the worker URL.");
  note("Rebuild the mobile app; the chip on the formula page flips to 'Personalized'.");
}

// ─── Status view ──────────────────────────────────────────────────────

function showStatus(profile: OperatorProfile): void {
  heading("Signup status");
  const rows: Array<[string, string | undefined, string | undefined]> = [
    ["Amazon Associates", profile.status.amazonAssociates?.startedAt, profile.status.amazonAssociates?.completedAt],
    ["Amazon PA-API", profile.status.amazonPaApi?.startedAt, profile.status.amazonPaApi?.completedAt],
    ["Walmart Affiliate", profile.status.walmartAffiliate?.startedAt, profile.status.walmartAffiliate?.completedAt],
    ["Anthropic API key", profile.status.anthropic?.startedAt, profile.status.anthropic?.completedAt],
  ];
  for (const [label, started, completed] of rows) {
    const icon = completed ? paint("✓", "sage") : started ? paint("·", "honey") : paint("○", "ink2");
    const state = completed
      ? paint(`completed ${new Date(completed).toLocaleDateString()}`, "sage")
      : started
        ? paint(`started ${new Date(started).toLocaleDateString()}`, "honey")
        : paint("not started", "ink2");
    console.log(`  ${icon} ${label.padEnd(22)} ${state}`);
  }
  if (profile.status.amazonAssociates?.associateTag) {
    console.log();
    note(`Amazon Associate Tag: ${profile.status.amazonAssociates.associateTag}`);
  }
  if (profile.status.walmartAffiliate?.consumerId) {
    note(`Walmart Consumer ID:  ${profile.status.walmartAffiliate.consumerId}`);
  }
}

// ─── Main menu ────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const rl = createInterface({ input, output });

  console.log();
  console.log(paint("Bottlewise Signup Copilot", "bold"));
  note("Walks you through Amazon, Walmart, and Anthropic signups.");
  note("Saves you the retyping; never auto-submits forms.");

  let profile = loadProfile();
  if (!profile) {
    const init = await confirm(rl, "No profile found. Create one now?");
    if (!init) {
      rl.close();
      return;
    }
    profile = await initProfile(rl);
  }

  let done = false;
  while (!done) {
    showStatus(profile);
    console.log();
    console.log(paint("Pick a vendor", "bold"));
    console.log("  1) Amazon Associates  →  PA-API");
    console.log("  2) Walmart Affiliate");
    console.log("  3) Anthropic API key  →  narrator worker secret");
    console.log("  4) Edit operator profile");
    console.log("  s) Show status");
    console.log("  q) Quit");
    const choice = (await rl.question("> ")).trim().toLowerCase();
    if (choice === "1") await walkAmazon(rl, profile);
    else if (choice === "2") await walkWalmart(rl, profile);
    else if (choice === "3") await walkAnthropic(rl, profile);
    else if (choice === "4") {
      profile = await initProfile(rl);
    } else if (choice === "s") {
      // status will print at top of next loop
    } else if (choice === "q") {
      done = true;
    } else {
      console.log(paint("  unrecognized choice", "danger"));
    }
  }

  rl.close();
  console.log();
  console.log(paint("Done. Profile saved to:", "sage"), PROFILE_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
