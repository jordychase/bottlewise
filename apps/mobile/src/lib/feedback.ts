/**
 * Beta feedback submission.
 *
 * V1: opens the user's email client with a pre-filled message + a
 * clipboard fallback for browsers without a mail handler. Captures the
 * route, the profile shape (sanitized — no PII), the user agent, and
 * the screen size as context so testers don't have to remember.
 *
 * V2 (deferred): a Cloudflare Worker endpoint that catches POSTs and
 * forwards to a real inbox or a feedback inbox like Linear / Plain /
 * Posthog. Architectural seam is here — swap mailto for a fetch when
 * the worker is up.
 */

import type { BabyProfile } from "@/state/baby-profile";

export type FeedbackCategory =
  | "bug"
  | "confusing"
  | "missing_feature"
  | "love_it"
  | "general";

export interface FeedbackInput {
  category: FeedbackCategory;
  message: string;
  route: string;
  profile: BabyProfile;
  email?: string;
}

const FEEDBACK_EMAIL = "feedback@bottlewise.app";

function isWeb(): boolean {
  return typeof globalThis !== "undefined" && typeof (globalThis as any).window !== "undefined";
}

function sanitizeProfile(p: BabyProfile): Record<string, unknown> {
  // Strip babyNameFirst — testers may have typed something we don't
  // need in the feedback log. Keep the structural context.
  return {
    babyAgeMonths: p.babyAgeMonths,
    familyEczema: p.familyEczema,
    familySoyAllergy: p.familySoyAllergy,
    familyCmpa: p.familyCmpa,
    preemie: p.preemie,
    prepMethod: p.prepMethod,
    issuesCount: p.issuesObserved.length,
    onFormula: !!p.currentFormulaId,
    watchingForRestock: !!p.watchForRestock,
  };
}

function formatBody(input: FeedbackInput): string {
  const userAgent =
    isWeb() && (globalThis as any).navigator
      ? (globalThis as any).navigator.userAgent
      : "(unknown)";
  const viewport =
    isWeb() && (globalThis as any).window
      ? `${(globalThis as any).window.innerWidth}×${(globalThis as any).window.innerHeight}`
      : "(unknown)";

  const lines = [
    `Category: ${input.category}`,
    `Route:    ${input.route}`,
    `Viewport: ${viewport}`,
    `Profile:  ${JSON.stringify(sanitizeProfile(input.profile))}`,
    `Email:    ${input.email ?? "(not provided)"}`,
    "",
    "--- Tester note ---",
    input.message,
    "",
    "--- User-agent ---",
    userAgent,
  ];
  return lines.join("\n");
}

export type SubmitResult =
  | { kind: "mailto_opened" }
  | { kind: "clipboard"; text: string }
  | { kind: "failed"; reason: string };

/**
 * Submit the feedback. Returns how it was delivered so the modal can
 * tell the tester what to do next (open the mail client, paste, etc.).
 */
export function submitFeedback(input: FeedbackInput): SubmitResult {
  const subject = `Bottlewise beta · ${input.category} on ${input.route}`;
  const body = formatBody(input);

  if (!isWeb()) {
    return { kind: "failed", reason: "Not running in a browser" };
  }

  // Try mailto first — works on every device with a configured mail client.
  const mailto = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  try {
    (globalThis as any).window.location.href = mailto;
    return { kind: "mailto_opened" };
  } catch {
    // Fall through.
  }

  // Clipboard fallback for kiosks / mail-less browsers.
  const text = `To: ${FEEDBACK_EMAIL}\nSubject: ${subject}\n\n${body}`;
  try {
    const clipboard = (globalThis as any).navigator?.clipboard;
    if (clipboard?.writeText) {
      clipboard.writeText(text);
    }
    return { kind: "clipboard", text };
  } catch {
    return { kind: "failed", reason: "Could not open mail client or copy to clipboard" };
  }
}

export const CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  bug: "Something's broken",
  confusing: "This screen confused me",
  missing_feature: "I wish it could…",
  love_it: "I love this part",
  general: "General feedback",
};
