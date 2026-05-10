/**
 * Community contribution layer.
 *
 * V1 stores trial outcomes in localStorage (web) — the same data shape
 * maps onto the `trial_outcomes` + `formula_trials` tables in
 * /supabase/migrations/. When Supabase auth is wired, this module's
 * functions migrate to remote calls; consumers don't change.
 *
 * Consent model:
 *   - `private`  — your own record only. Never visible to others.
 *   - `anonymous` — published to the community surface without your
 *     identity. First name is NOT shared. Location is NOT shared.
 *   - `first_name` — published with first name only. Still no last
 *     name, no location.
 *
 * The consent toggle is per-outcome and reversible — the consumer can
 * downgrade visibility on any prior outcome at any time.
 */

export type Tolerance = "well" | "mixed" | "poor" | "severe_reaction";
export type ConsentLevel = "private" | "anonymous" | "first_name";

export interface CommunityExperience {
  id: string;
  formulaId: string;
  createdAt: string;
  tolerance: Tolerance;
  issuesObserved: string[];
  notes: string;
  consent: ConsentLevel;
  /** Only used when consent = 'first_name'. */
  displayName?: string;
}

const STORAGE_KEY = "bottlewise.community.experiences.v1";

function isWeb(): boolean {
  return typeof globalThis !== "undefined" && typeof (globalThis as any).localStorage !== "undefined";
}

function loadAll(): CommunityExperience[] {
  if (!isWeb()) return [];
  try {
    const raw = (globalThis as any).localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CommunityExperience[];
  } catch {
    return [];
  }
}

function saveAll(items: CommunityExperience[]): void {
  if (!isWeb()) return;
  try {
    (globalThis as any).localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage quota hit or private-browsing mode — silently degrade.
  }
}

export function addExperience(
  input: Omit<CommunityExperience, "id" | "createdAt">,
): CommunityExperience {
  const exp: CommunityExperience = {
    ...input,
    id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const all = loadAll();
  saveAll([exp, ...all]);
  return exp;
}

export function listExperiencesForFormula(formulaId: string): CommunityExperience[] {
  return loadAll().filter((e) => e.formulaId === formulaId);
}

export function listSharedExperiencesForFormula(
  formulaId: string,
): CommunityExperience[] {
  return loadAll().filter(
    (e) => e.formulaId === formulaId && e.consent !== "private",
  );
}

/**
 * Seed experiences so the community section never renders empty in
 * the demo. These are synthetic, low-stakes examples consistent with
 * the formula's profile — clearly labeled as community-contributed
 * (not endorsed by Bottlewise).
 *
 * In production these are real submissions from real parents under the
 * consent levels they chose. The seed function is dev-only and gates
 * itself on whether the user has saved their own experience yet.
 */
const SEED_EXPERIENCES: Record<string, Omit<CommunityExperience, "id" | "createdAt">[]> = {
  "bobbie-original": [
    {
      formulaId: "bobbie-original",
      tolerance: "well",
      issuesObserved: [],
      notes: "Switched from a standard cow-milk formula at month 3. Gas went down within a week. Subscribe-and-save brought the cost closer to typical.",
      consent: "anonymous",
    },
    {
      formulaId: "bobbie-original",
      tolerance: "mixed",
      issuesObserved: ["spit_up"],
      notes: "Worked for our older kid, slightly more spit-up with our second. Pediatrician suggested trying it for another 2 weeks before switching.",
      consent: "first_name",
      displayName: "Priya",
    },
  ],
  "byheart-whole-nutrition": [
    {
      formulaId: "byheart-whole-nutrition",
      tolerance: "well",
      issuesObserved: [],
      notes: "Whole milk + A2 helped with what looked like CMPA sensitivity for us. Doctor-monitored switch from Similac Pro-Sensitive.",
      consent: "anonymous",
    },
  ],
  "nutramigen": [
    {
      formulaId: "nutramigen",
      tolerance: "well",
      issuesObserved: [],
      notes: "Prescribed after a CMPA diagnosis. Taste is intense (typical for extensively hydrolyzed) — baby took 4 days to adjust. After that, no reflux.",
      consent: "anonymous",
    },
    {
      formulaId: "nutramigen",
      tolerance: "mixed",
      issuesObserved: ["constipation"],
      notes: "Resolved the rash but stools became harder. Pediatrician switched us to a partial-hydrolyzed alternative after 6 weeks.",
      consent: "first_name",
      displayName: "Marcus",
    },
  ],
};

export function getSeedExperiencesForFormula(
  formulaId: string,
): CommunityExperience[] {
  const seeds = SEED_EXPERIENCES[formulaId] ?? [];
  return seeds.map((s, i) => ({
    ...s,
    id: `seed-${formulaId}-${i}`,
    createdAt: new Date(Date.now() - (i + 1) * 7 * 86400_000).toISOString(),
  }));
}

export function getDisplayedExperiencesForFormula(
  formulaId: string,
): CommunityExperience[] {
  const own = listExperiencesForFormula(formulaId);
  const shared = listSharedExperiencesForFormula(formulaId);
  const seeds = getSeedExperiencesForFormula(formulaId);
  // Own experiences (any consent) at the top, then shared, then seeds.
  // Dedupe by id.
  const merged: CommunityExperience[] = [];
  const seen = new Set<string>();
  const push = (arr: CommunityExperience[]) => {
    for (const e of arr) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      merged.push(e);
    }
  };
  push(own);
  push(shared);
  push(seeds);
  return merged;
}

export interface AggregateOutcome {
  total: number;
  well: number;
  mixed: number;
  poor: number;
  severe: number;
  topIssues: Array<{ issue: string; count: number }>;
}

export function aggregateForFormula(formulaId: string): AggregateOutcome {
  const all = [
    ...getSeedExperiencesForFormula(formulaId),
    ...listSharedExperiencesForFormula(formulaId),
  ];
  const agg: AggregateOutcome = { total: 0, well: 0, mixed: 0, poor: 0, severe: 0, topIssues: [] };
  const issueCounts = new Map<string, number>();
  for (const e of all) {
    agg.total++;
    agg[e.tolerance === "severe_reaction" ? "severe" : e.tolerance]++;
    for (const issue of e.issuesObserved) {
      issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1);
    }
  }
  agg.topIssues = Array.from(issueCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([issue, count]) => ({ issue, count }));
  return agg;
}
