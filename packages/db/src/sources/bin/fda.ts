#!/usr/bin/env tsx
/**
 * CLI entrypoint for FDA gate + recall adapters.
 *
 *   pnpm --filter @bottlewise/db run fda                # full sweep
 *   pnpm --filter @bottlewise/db run fda --since=2024-01-01
 *   pnpm --filter @bottlewise/db run fda --recalls-only
 *   pnpm --filter @bottlewise/db run fda --submissions-only
 *   pnpm --filter @bottlewise/db run fda --out=./staging/fda
 *
 * The submissions adapter is the gate: only formulas whose brand +
 * product name appear in the submissions list are allowed to surface
 * to users (DATA_SOURCING.md § 1 Principle 2).
 *
 * The recalls adapter runs every 15 minutes in production. Class I
 * events trigger downstream notification + recommendation downrank.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fetchFdaSubmissions } from "../adapters/fda-submissions.js";
import { fetchOpenFdaRecalls } from "../adapters/openfda-recalls.js";

interface ParsedArgs {
  recallsOnly?: boolean;
  submissionsOnly?: boolean;
  since?: string;
  out?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {};
  for (const arg of argv) {
    if (arg === "--recalls-only") out.recallsOnly = true;
    else if (arg === "--submissions-only") out.submissionsOnly = true;
    else if (arg.startsWith("--since="))
      out.since = arg.slice("--since=".length);
    else if (arg.startsWith("--out=")) out.out = arg.slice("--out=".length);
  }
  return out;
}

async function persist(filename: string, data: unknown, outputDir?: string) {
  if (!outputDir) return;
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const path = join(outputDir, `${ts}-${filename}.json`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), "utf8");
  console.log(`  wrote ${path}`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.recallsOnly) {
    console.log("Fetching FDA Infant Formula Submissions list...");
    try {
      const result = await fetchFdaSubmissions();
      console.log(
        `  ${result.records.length} submissions across ${result.manufacturerCount} manufacturers`,
      );
      await persist("fda-submissions", result, args.out);
    } catch (err) {
      console.error(`  FAILED: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  }

  if (!args.submissionsOnly) {
    console.log(
      `Fetching openFDA Food Enforcement (recalls)${args.since ? ` since ${args.since}` : ""}...`,
    );
    try {
      const result = await fetchOpenFdaRecalls({ since: args.since });
      console.log(
        `  ${result.records.length} recall record(s); ${result.classI.length} Class I`,
      );
      for (const r of result.classI.slice(0, 5)) {
        console.log(
          `    [${r.classification}] ${r.recall_initiation_date} ${r.recalling_firm}: ${r.product_description.slice(0, 100)}`,
        );
      }
      await persist("openfda-recalls", result, args.out);
    } catch (err) {
      console.error(`  FAILED: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
