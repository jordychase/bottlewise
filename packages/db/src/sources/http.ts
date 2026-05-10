/**
 * Polite HTTP client — rate limits per origin, identifies us in the UA,
 * caps retries, and makes the politeness contract easy to audit. Used by
 * every brand-DTC engine.
 *
 * Companion to `docs/DATA_SOURCING.md` § 7 Scraping policy.
 */

const VERSION = "0.0.1";
export const USER_AGENT = `Bottlewise/${VERSION} (+https://github.com/jordychase/bottlewise; data@bottlewise.app)`;

const DEFAULT_RATE_LIMIT_MS = 5000;
const FDA_RATE_LIMIT_MS = 30000;

export interface FetchOptions {
  /** Override per-origin rate limit in ms. */
  rateLimitMs?: number;
  /** Treat non-2xx as fatal (no retry). Default true. */
  failFastOn4xx?: boolean;
  /** Max attempts on 5xx with exponential backoff. Default 3. */
  retries?: number;
}

interface OriginState {
  lastRequestAt: number;
  rateLimitMs: number;
}

const originState = new Map<string, OriginState>();

function originKey(url: string): string {
  return new URL(url).origin;
}

function rateLimitFor(url: string, override?: number): number {
  if (override !== undefined) return override;
  const host = new URL(url).hostname;
  if (host.endsWith("fda.gov")) return FDA_RATE_LIMIT_MS;
  return DEFAULT_RATE_LIMIT_MS;
}

async function waitForOrigin(url: string, rateLimitMs: number): Promise<void> {
  const key = originKey(url);
  const state = originState.get(key);
  const now = Date.now();
  if (state) {
    const elapsed = now - state.lastRequestAt;
    const wait = state.rateLimitMs - elapsed;
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  originState.set(originKey(url), {
    lastRequestAt: Date.now(),
    rateLimitMs,
  });
}

async function backoff(attempt: number): Promise<void> {
  const ms = Math.min(60000, 1000 * 2 ** attempt);
  await new Promise((r) => setTimeout(r, ms));
}

export class PoliteHttpError extends Error {
  status?: number;
  url: string;
  constructor(url: string, message: string, status?: number) {
    super(message);
    this.url = url;
    this.status = status;
  }
}

export async function politeFetch(
  url: string,
  opts: FetchOptions = {},
): Promise<Response> {
  const rateLimitMs = rateLimitFor(url, opts.rateLimitMs);
  const failFastOn4xx = opts.failFastOn4xx ?? true;
  const retries = opts.retries ?? 3;

  let attempt = 0;
  while (true) {
    await waitForOrigin(url, rateLimitMs);
    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept:
            "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
      });
    } catch (err) {
      if (attempt >= retries) {
        throw new PoliteHttpError(
          url,
          `Network error: ${(err as Error).message}`,
        );
      }
      await backoff(attempt++);
      continue;
    }

    if (res.ok) return res;

    if (res.status >= 400 && res.status < 500) {
      if (failFastOn4xx) {
        throw new PoliteHttpError(
          url,
          `Client error ${res.status} ${res.statusText}`,
          res.status,
        );
      }
      return res;
    }

    if (res.status >= 500) {
      if (attempt >= retries) {
        throw new PoliteHttpError(
          url,
          `Server error ${res.status} after ${retries} retries`,
          res.status,
        );
      }
      await backoff(attempt++);
      continue;
    }

    return res;
  }
}

export async function getJson<T = unknown>(
  url: string,
  opts: FetchOptions = {},
): Promise<T> {
  const res = await politeFetch(url, opts);
  return (await res.json()) as T;
}

export async function getText(
  url: string,
  opts: FetchOptions = {},
): Promise<string> {
  const res = await politeFetch(url, opts);
  return await res.text();
}
