/**
 * Baby profile store.
 *
 * Single source of truth for the values the recommendation engine,
 * narrator, similarity engine, and quantity suggester all read from.
 * Replaces the static `DEMO_PROFILE` constant that previously lived
 * in screens.
 *
 * V1 storage: localStorage on web. Native devices will swap to
 * @react-native-async-storage/async-storage; the hook API stays the
 * same. Future: Supabase trial of the same shape once auth is wired.
 *
 * Defaults: Maya, 3 months, family eczema, hand-measure prep. The
 * defaults exist so the demo flow works without forcing onboarding;
 * any value set via the intake flow overwrites them.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type PrepMethod =
  | "hand"
  | "baby_brezza"
  | "tommee_tippee"
  | "dr_browns"
  | "other";

export type SwitchReason = "stock" | "recall" | "tolerance" | "cost" | "preference";

export interface BabyProfile {
  babyNameFirst: string;
  babyAgeMonths: number;
  babyDob?: string;
  familySoyAllergy: boolean;
  familyEczema: boolean;
  familyCmpa: boolean;
  preemie: boolean;
  prepMethod: PrepMethod;
  issuesObserved: string[];
  /** The formula actively being used right now. */
  currentFormulaId?: string;
  /** The formula being temporarily substituted (parent wants to switch
   *  back if it returns / problem resolves). */
  previousFormulaId?: string;
  /** When and why the parent switched. */
  switchedAt?: string;
  switchedDueTo?: SwitchReason;
  /** When true, Bottlewise watches stock_signals for previousFormulaId
   *  and surfaces a RestockBanner the moment it returns. */
  watchForRestock?: boolean;
  /** Set when the parent accepts the first-launch disclosure modal.
   *  Persisted alongside the profile so the modal never reappears for
   *  this user. */
  hasAcceptedDisclosure?: boolean;
}

const DEFAULT_PROFILE: BabyProfile = {
  babyNameFirst: "Maya",
  babyAgeMonths: 3,
  familySoyAllergy: false,
  familyEczema: true,
  familyCmpa: false,
  preemie: false,
  prepMethod: "hand",
  issuesObserved: ["reflux", "fussy"],
  // Demo state: Maya is on Bobbie Original by default so the
  // current-formula + restock surfaces work out of the box.
  currentFormulaId: "bobbie-original",
};

const STORAGE_KEY = "bottlewise.baby-profile.v1";

function loadFromStorage(): BabyProfile {
  if (typeof globalThis === "undefined") return DEFAULT_PROFILE;
  const storage = (globalThis as { localStorage?: Storage }).localStorage;
  if (!storage) return DEFAULT_PROFILE;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function saveToStorage(profile: BabyProfile): void {
  if (typeof globalThis === "undefined") return;
  const storage = (globalThis as { localStorage?: Storage }).localStorage;
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage full / private browsing — silent degradation.
  }
}

interface BabyProfileContextValue {
  profile: BabyProfile;
  update: (patch: Partial<BabyProfile>) => void;
  reset: () => void;
  /** Wipe everything Bottlewise has stored on this device — profile,
   *  community experiences, reports, stock state, AND the saved
   *  disclosure-acceptance flag. Used by Settings → Delete my account. */
  deleteAllLocalData: () => void;
}

const BabyProfileContext = createContext<BabyProfileContextValue | null>(null);

export function BabyProfileProvider({ children }: { children: React.ReactNode }) {
  // Initialize synchronously from storage so the first render of any
  // consumer has the right values — no flicker between defaults and saved.
  const [profile, setProfile] = useState<BabyProfile>(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(profile);
  }, [profile]);

  const update = useCallback((patch: Partial<BabyProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
  }, []);

  const deleteAllLocalData = useCallback(() => {
    if (typeof globalThis !== "undefined") {
      const storage = (globalThis as { localStorage?: Storage }).localStorage;
      if (storage) {
        // Wipe every Bottlewise key. Anything new should follow the
        // `bottlewise.` prefix convention so this remains exhaustive.
        const keys: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const k = storage.key(i);
          if (k && k.startsWith("bottlewise.")) keys.push(k);
        }
        for (const k of keys) storage.removeItem(k);
      }
    }
    // Reset in-memory profile to a truly empty state — no defaults.
    setProfile({
      babyNameFirst: "",
      babyAgeMonths: 0,
      familySoyAllergy: false,
      familyEczema: false,
      familyCmpa: false,
      preemie: false,
      prepMethod: "hand",
      issuesObserved: [],
      hasAcceptedDisclosure: false,
    });
  }, []);

  const value = useMemo(
    () => ({ profile, update, reset, deleteAllLocalData }),
    [profile, update, reset, deleteAllLocalData],
  );

  return (
    <BabyProfileContext.Provider value={value}>
      {children}
    </BabyProfileContext.Provider>
  );
}

export function useBabyProfile(): BabyProfileContextValue {
  const value = useContext(BabyProfileContext);
  if (!value) {
    throw new Error("useBabyProfile must be used inside <BabyProfileProvider>");
  }
  return value;
}
