#!/usr/bin/env tsx
/**
 * `pnpm creds:check` — show which adapter credentials are set, which
 * are missing, and whether the keys parse correctly. Does NOT make
 * any network calls; safe to run before you've been approved for the
 * various APIs.
 *
 * For an end-to-end verification once creds are in place:
 *   pnpm seed:validate --brand=parents-choice    # exercises Walmart
 *   pnpm seed:validate --brand=mama-bear         # exercises Amazon
 *   pnpm seed:validate --brand=up-and-up         # exercises Target
 */

import { hasAmazonCredentials } from "../adapters/amazon-pa-api.js";
import { hasWalmartCredentials } from "../adapters/walmart.js";

interface Status {
  name: string;
  present: boolean;
  hint: string;
  detail?: string;
}

function maskedTail(s?: string, keep = 4): string {
  if (!s) return "";
  if (s.length <= keep) return "*".repeat(s.length);
  return "…" + s.slice(-keep);
}

function checkAmazon(): Status {
  const ok = hasAmazonCredentials();
  const tag = process.env.AMAZON_PA_ASSOCIATE_TAG;
  const key = process.env.AMAZON_PA_ACCESS_KEY;
  return {
    name: "Amazon PA-API",
    present: ok,
    hint: ok
      ? `Associate tag ${tag}, key ${maskedTail(key)}`
      : "Need AMAZON_PA_ACCESS_KEY + AMAZON_PA_SECRET_KEY + AMAZON_PA_ASSOCIATE_TAG",
  };
}

function checkWalmart(): Status {
  const ok = hasWalmartCredentials();
  const id = process.env.WALMART_CONSUMER_ID;
  const key = process.env.WALMART_PRIVATE_KEY;
  let parses = false;
  if (key) {
    const normalized = key.replace(/\\n/g, "\n");
    parses = /-----BEGIN (RSA )?PRIVATE KEY-----/.test(normalized) &&
      /-----END (RSA )?PRIVATE KEY-----/.test(normalized);
  }
  return {
    name: "Walmart Affiliate",
    present: ok && parses,
    hint: !id
      ? "Need WALMART_CONSUMER_ID"
      : !key
        ? "Need WALMART_PRIVATE_KEY (run scripts/gen-walmart-key.sh first)"
        : !parses
          ? "WALMART_PRIVATE_KEY set but doesn't look like a PEM private key"
          : `Consumer ${maskedTail(id, 6)}, key OK, version ${process.env.WALMART_PRIVATE_KEY_VERSION ?? "1"}`,
  };
}

function checkTarget(): Status {
  const override = process.env.TARGET_REDSKY_VISITOR_KEY;
  return {
    name: "Target RedSky",
    present: true,
    hint: override
      ? `Custom visitor key set (${maskedTail(override)})`
      : "Using built-in default — works without env",
  };
}

function checkSupabase(): Status {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    name: "Supabase (server)",
    present: !!url && !!key,
    hint:
      url && key
        ? `${url} · service-role ${maskedTail(key)}`
        : "Optional for read-only adapter runs. Required for --db writes + merge.",
  };
}

const ALL_CHECKS = [checkAmazon, checkWalmart, checkTarget, checkSupabase];

function main(): void {
  console.log("Bottlewise adapter credentials");
  console.log("─".repeat(60));
  let allRequired = true;
  for (const check of ALL_CHECKS) {
    const status = check();
    const icon = status.present ? "✓" : "·";
    console.log(`${icon} ${status.name.padEnd(22)} ${status.hint}`);
    if (status.name !== "Target RedSky" && status.name !== "Supabase (server)" && !status.present) {
      allRequired = false;
    }
  }
  console.log("─".repeat(60));
  if (allRequired) {
    console.log("All retailer creds set. Run `pnpm seed:validate --segment=private_label` to verify against live APIs.");
  } else {
    console.log("Some retailer credentials are missing. See docs/CREDENTIALS_SETUP.md.");
    process.exitCode = 1;
  }
}

main();
