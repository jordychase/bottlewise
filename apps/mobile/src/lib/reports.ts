/**
 * Community experience reports.
 *
 * V1 storage: localStorage. Mirrors the shape of an `experience_reports`
 * table that will land in /supabase/migrations/ when auth ships:
 *   id, experience_id, reporter_user_id, reason, detail, created_at,
 *   status ('pending' | 'reviewed' | 'dismissed' | 'actioned').
 *
 * The reporting flow is a hard requirement for both the App Store and
 * the Play Store when UGC is enabled (which Community Experiences are).
 * Apple Guideline 1.2 and the Play Console Restricted Content policy
 * both require: a way to flag content, a moderation pipeline, and
 * action on reports within a published timeframe (Bottlewise pledges
 * 72h in the Terms of Service).
 */

export type ReportReason =
  | "medical_misinformation"
  | "personal_info"
  | "abusive"
  | "spam_or_promo"
  | "other";

export interface ExperienceReport {
  id: string;
  experienceId: string;
  reason: ReportReason;
  detail?: string;
  createdAt: string;
  /** Local-only flag: the reporting user has hidden the experience on
   *  their device pending Bottlewise moderation. */
  hiddenLocally: boolean;
}

const STORAGE_KEY = "bottlewise.community.reports.v1";

function isWeb(): boolean {
  return typeof globalThis !== "undefined" && typeof (globalThis as any).localStorage !== "undefined";
}

function loadAll(): ExperienceReport[] {
  if (!isWeb()) return [];
  try {
    const raw = (globalThis as any).localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ExperienceReport[];
  } catch {
    return [];
  }
}

function saveAll(items: ExperienceReport[]): void {
  if (!isWeb()) return;
  try {
    (globalThis as any).localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage full / private browsing — silent degradation
  }
}

export function addReport(input: {
  experienceId: string;
  reason: ReportReason;
  detail?: string;
  hideLocally: boolean;
}): ExperienceReport {
  const report: ExperienceReport = {
    id: `report-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    experienceId: input.experienceId,
    reason: input.reason,
    detail: input.detail,
    createdAt: new Date().toISOString(),
    hiddenLocally: input.hideLocally,
  };
  const all = loadAll();
  saveAll([report, ...all]);
  return report;
}

export function isHiddenLocally(experienceId: string): boolean {
  return loadAll().some(
    (r) => r.experienceId === experienceId && r.hiddenLocally,
  );
}

export function listReports(): ExperienceReport[] {
  return loadAll();
}

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  medical_misinformation: "Medical misinformation",
  personal_info: "Personal information exposed",
  abusive: "Abusive or harassing",
  spam_or_promo: "Spam or promotional",
  other: "Something else",
};

export const REPORT_REASON_HINT: Record<ReportReason, string> = {
  medical_misinformation: "Claims a formula treats, cures, or prevents a condition — Bottlewise content rules forbid this.",
  personal_info: "Mentions a last name, address, phone number, or other identifying details.",
  abusive: "Defames or harasses a person, brand, or group.",
  spam_or_promo: "Promotes a brand, retailer, or competing service.",
  other: "Something not covered by the categories above.",
};
