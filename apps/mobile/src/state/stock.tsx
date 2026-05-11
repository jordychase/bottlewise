/**
 * Simulated stock signals.
 *
 * For the V1 demo this is local React state — the parent can flip a
 * formula's status to test the restock-detection surface. In production
 * this gets replaced by a Supabase Realtime subscription on the
 * `stock_signals` table; consumers (RestockBanner, etc.) use the same
 * hook so the UI doesn't change when the data source does.
 *
 * `stock_signals` per /supabase/migrations/20260509120500_stock_signals.sql
 * is append-only with a decay-at-read-time confidence model. The
 * simplified shape we expose here is `'in_stock' | 'low' | 'oos'` —
 * the actual data layer rolls multiple recent signals into one status
 * with last-observed-at metadata; we ignore that for the demo.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type StockStatus = "in_stock" | "low" | "oos";

interface StockEvent {
  formulaId: string;
  /** Previous status — useful for "just came back" detection. */
  from: StockStatus;
  to: StockStatus;
  at: string;
}

interface StockContextValue {
  status: Record<string, StockStatus>;
  /** Set status explicitly. */
  setStatus: (formulaId: string, next: StockStatus) => void;
  /** Demo helper — flip a formula from OOS to in-stock. */
  simulateRestock: (formulaId: string) => void;
  /** Demo helper — flip a formula to OOS. */
  simulateOutage: (formulaId: string) => void;
  /** Subscribe to status transitions. */
  onTransition: (handler: (event: StockEvent) => void) => () => void;
  lastTransition: StockEvent | null;
}

const StockContext = createContext<StockContextValue | null>(null);

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatusMap] = useState<Record<string, StockStatus>>({});
  const handlersRef = useRef(new Set<(event: StockEvent) => void>());
  const [lastTransition, setLastTransition] = useState<StockEvent | null>(null);

  const fire = useCallback(
    (formulaId: string, from: StockStatus, to: StockStatus) => {
      const event: StockEvent = { formulaId, from, to, at: new Date().toISOString() };
      setLastTransition(event);
      for (const h of handlersRef.current) h(event);
    },
    [],
  );

  const setStatus = useCallback(
    (formulaId: string, next: StockStatus) => {
      setStatusMap((prev) => {
        const previous: StockStatus = prev[formulaId] ?? "in_stock";
        if (previous !== next) {
          // Defer firing to next tick so subscribers see post-render state.
          queueMicrotask(() => fire(formulaId, previous, next));
        }
        return { ...prev, [formulaId]: next };
      });
    },
    [fire],
  );

  const simulateRestock = useCallback(
    (formulaId: string) => setStatus(formulaId, "in_stock"),
    [setStatus],
  );
  const simulateOutage = useCallback(
    (formulaId: string) => setStatus(formulaId, "oos"),
    [setStatus],
  );

  const onTransition = useCallback((handler: (event: StockEvent) => void) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  const value = useMemo(
    () => ({ status, setStatus, simulateRestock, simulateOutage, onTransition, lastTransition }),
    [status, setStatus, simulateRestock, simulateOutage, onTransition, lastTransition],
  );

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}

export function useStock(): StockContextValue {
  const value = useContext(StockContext);
  if (!value) throw new Error("useStock must be used inside <StockProvider>");
  return value;
}

/**
 * Returns the effective status, defaulting to "in_stock" when no signal
 * has been recorded — matches production behavior where absence of a
 * "low" or "oos" signal implies stock.
 */
export function statusOf(
  status: Record<string, StockStatus>,
  formulaId: string,
): StockStatus {
  return status[formulaId] ?? "in_stock";
}

/**
 * Hook: returns true when `formulaId` transitions from oos/low → in_stock.
 * Used by the RestockBanner to know when to surface.
 */
export function useRestockSignal(formulaId: string | undefined): boolean {
  const { status, onTransition } = useStock();
  const [didRestock, setDidRestock] = useState(false);
  useEffect(() => {
    if (!formulaId) {
      setDidRestock(false);
      return;
    }
    // Initial check: if the formula is already in stock and we haven't
    // shown the banner yet, defer to the explicit transition path —
    // we don't want to fire the banner on app load.
    return onTransition((event) => {
      if (event.formulaId !== formulaId) return;
      if (event.to === "in_stock" && event.from !== "in_stock") {
        setDidRestock(true);
      }
    });
  }, [formulaId, onTransition]);
  // Also reset when the formula changes or the status flips back to oos.
  useEffect(() => {
    if (!formulaId) return;
    const current = statusOf(status, formulaId);
    if (current !== "in_stock") setDidRestock(false);
  }, [formulaId, status]);
  return didRestock;
}
