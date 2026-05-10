#!/usr/bin/env tsx
/**
 * CLI entrypoint for the brand-DTC seed runner.
 *
 *   pnpm seed --list                  # print every registered brand
 *   pnpm seed --dry                   # dispatch but don't fetch
 *   pnpm seed --brand=bobbie          # run a single brand
 *   pnpm seed --segment=european_import
 *   pnpm seed --limit=5
 *   pnpm seed --out=./staging
 *
 * Without --out, results print to stdout. With --out, normalized records
 * land at `<out>/<brand>/<ts>.json` for inspection. Once Supabase is
 * wired in, the runner will write to `source_records` instead.
 */

import { runAll } from "../runner.js";
import { BRAND_REGISTRY, findBrand, listBrands } from "../registry.js";
import { validateBrand } from "../validate.js";
import type { BrandSegment, RunOptions } from "../types.js";

interface ParsedArgs {
  list?: boolean;
  dry?: boolean;
  validate?: boolean;
  brand?: string;
  segment?: BrandSegment;
  limit?: number;
  out?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {};
  for (const arg of argv) {
    if (arg === "--list") out.list = true;
    else if (arg === "--dry") out.dry = true;
    else if (arg === "--validate") out.validate = true;
    else if (arg.startsWith("--brand=")) out.brand = arg.slice("--brand=".length);
    else if (arg.startsWith("--segment="))
      out.segment = arg.slice("--segment=".length) as BrandSegment;
    else if (arg.startsWith("--limit="))
      out.limit = Number(arg.slice("--limit=".length));
    else if (arg.startsWith("--out="))
      out.out = arg.slice("--out=".length);
  }
  return out;
}

async function runValidation(args: ParsedArgs): Promise<void> {
  const targets = args.brand
    ? [findBrand(args.brand)].filter(Boolean) as typeof BRAND_REGISTRY
    : args.segment
      ? BRAND_REGISTRY.filter((b) => b.segments.includes(args.segment!))
      : BRAND_REGISTRY;
  const slice = targets.slice(0, args.limit ?? targets.length);
  console.log(`Validating ${slice.length} brand(s)...\n`);
  let pass = 0;
  let fail = 0;
  let skipped = 0;
  for (const brand of slice) {
    const r = await validateBrand(brand);
    const icon = r.status === "pass" ? "✓" : r.status === "fail" ? "✗" : "·";
    console.log(
      `${icon} ${r.brandId.padEnd(28)} ${r.engine.padEnd(13)} ${r.message}`,
    );
    if (r.hint) console.log(`     hint: ${r.hint}`);
    if (r.status === "pass") pass++;
    else if (r.status === "fail") fail++;
    else skipped++;
  }
  console.log(`\nValidation: ${pass} pass, ${fail} fail, ${skipped} skipped.`);
  if (fail > 0) process.exitCode = 1;
}

function printList(): void {
  const groups = new Map<string, typeof BRAND_REGISTRY>();
  for (const b of BRAND_REGISTRY) {
    const seg = b.segments[0] ?? "niche";
    if (!groups.has(seg)) groups.set(seg, []);
    groups.get(seg)!.push(b);
  }
  for (const [seg, brands] of groups) {
    console.log(`\n## ${seg} (${brands.length})`);
    for (const b of brands) {
      const v = b.validated ? " [validated]" : " [needs validation]";
      console.log(`  ${b.id.padEnd(28)} ${b.config.engine.padEnd(13)} ${b.name}${v}`);
    }
  }
  console.log(`\nTotal: ${BRAND_REGISTRY.length} brands.`);
  const byEngine = new Map<string, number>();
  for (const b of BRAND_REGISTRY) {
    byEngine.set(b.config.engine, (byEngine.get(b.config.engine) ?? 0) + 1);
  }
  console.log(
    "By engine: " +
      Array.from(byEngine)
        .map(([e, n]) => `${e}=${n}`)
        .join(", "),
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.list) {
    printList();
    return;
  }

  if (args.validate) {
    await runValidation(args);
    return;
  }

  const opts: RunOptions = {
    brandId: args.brand,
    segment: args.segment,
    dryRun: args.dry,
    limit: args.limit,
    outputDir: args.out,
  };

  const results = await runAll(opts);

  let totalSeen = 0;
  let totalNormalized = 0;
  let totalErrors = 0;
  for (const r of results) {
    totalSeen += r.recordsSeen;
    totalNormalized += r.recordsNormalized;
    totalErrors += r.errors.length;
    const errSummary =
      r.errors.length > 0 ? ` errors=${r.errors.length}` : "";
    console.log(
      `${r.brandId.padEnd(28)} ${r.adapterId.padEnd(35)} seen=${r.recordsSeen} norm=${r.recordsNormalized}${errSummary}`,
    );
    for (const err of r.errors.slice(0, 3)) {
      console.log(`  ! ${err.code ?? "ERR"}: ${err.message}`);
    }
  }
  console.log(
    `\nTotal: ${results.length} brands, ${totalSeen} records seen, ${totalNormalized} normalized, ${totalErrors} errors.`,
  );
  if (args.dry) console.log("(dry run — no fetches performed)");
  if (!args.out && !args.dry)
    console.log(
      "(no --out specified — raw payloads not persisted; pass --out=./staging to save)",
    );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
