#!/usr/bin/env tsx
/**
 * Merge CLI: pull source_records into canonical formulas + ingredients.
 *
 *   pnpm merge                              # full sweep
 *   pnpm merge -- --brand=bobbie            # one brand
 *   pnpm merge -- --since=2026-05-01
 *   pnpm merge -- --dry                     # report plan only
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.
 */

import { getSupabaseClient } from "../../client.js";
import { mergeCanonical } from "../merge.js";

interface ParsedArgs {
  brand?: string;
  since?: string;
  dry?: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {};
  for (const arg of argv) {
    if (arg === "--dry") out.dry = true;
    else if (arg.startsWith("--brand="))
      out.brand = arg.slice("--brand=".length);
    else if (arg.startsWith("--since="))
      out.since = arg.slice("--since=".length);
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const client = getSupabaseClient();
  const result = await mergeCanonical(client, {
    brandRegistryId: args.brand,
    since: args.since,
    dryRun: args.dry,
  });

  console.log(`Products considered: ${result.productsConsidered}`);
  console.log(`Formulas upserted:   ${result.formulasUpserted}`);
  console.log(`Ingredients written: ${result.ingredientsUpserted}`);
  console.log(`Conflicts logged:    ${result.conflictsLogged}`);
  for (const err of result.errors) console.error(`  ! ${err}`);
  if (args.dry) console.log("(dry run — no writes performed)");
  if (result.errors.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
