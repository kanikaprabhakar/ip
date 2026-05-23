const BASE_URL = "https://quoterism.com/api";

// Server-side in-memory cache — one Quoterism call per UTC day max
let _cachedQuote: Quote | null = null;
let _cachedDate = "";

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface QuoteAuthor {
  id: string;
  name: string;
}

export interface Quote {
  id: string;
  text: string;
  author: QuoteAuthor;
}

export interface QuotePage {
  quotes: Quote[];
  total: number;
  page: number;
  limit: number;
}

const FALLBACK_QUOTE: Quote = {
  id: "fallback",
  text: "Small progress is still progress.",
  author: { id: "fallback", name: "Zenith" },
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeQuote(payload: unknown): Quote {
  const root = asRecord(payload);
  const wrapped = asRecord(root?.data) ?? asRecord(root?.quote) ?? root;
  const authorRaw = asRecord(wrapped?.author);

  const textCandidate = wrapped?.text ?? wrapped?.quote ?? wrapped?.content;
  const text = typeof textCandidate === "string" ? textCandidate.trim() : "";

  const authorName =
    typeof authorRaw?.name === "string"
      ? authorRaw.name
      : typeof wrapped?.author === "string"
      ? wrapped.author
      : "Unknown";

  const idCandidate = wrapped?.id ?? wrapped?._id;
  const authorIdCandidate = authorRaw?.id ?? authorRaw?._id;

  if (!text) return FALLBACK_QUOTE;

  return {
    id: typeof idCandidate === "string" ? idCandidate : "unknown",
    text,
    author: {
      id: typeof authorIdCandidate === "string" ? authorIdCandidate : "unknown",
      name: authorName,
    },
  };
}

function headers(): HeadersInit {
  const apiKey = process.env.QUOTERISM_API_KEY?.trim();
  return {
    ...(apiKey ? { "X-API-Key": apiKey, Authorization: `Bearer ${apiKey}` } : {}),
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

/**
 * Fetch a single quote by ID.
 * Use id = "random" or id = "quote-of-the-day" for special values.
 */
export async function getQuote(id: string): Promise<Quote> {
  const today = todayUTC();
  // Serve from memory cache for quote-of-the-day so we don't hammer the API
  if (id === "quote-of-the-day" && _cachedQuote && _cachedDate === today) {
    return _cachedQuote;
  }
  const res = await fetch(`${BASE_URL}/quotes/${id}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Quoterism error: ${res.status}`);
  const quote = normalizeQuote(await res.json());
  if (id === "quote-of-the-day") {
    _cachedQuote = quote;
    _cachedDate = today;
  }
  return quote;
}

/**
 * Fetch a paginated list of quotes.
 */
export async function getQuotes(page = 0, limit = 12): Promise<QuotePage> {
  const url = new URL(`${BASE_URL}/quotes`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: headers(),
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Quoterism error: ${res.status}`);
  const body = await res.json() as Record<string, unknown>;
  const rawQuotes = Array.isArray(body.quotes)
    ? body.quotes
    : Array.isArray(body.data)
    ? body.data
    : [];
  return {
    quotes: rawQuotes.map((item) => normalizeQuote(item)),
    total: typeof body.total === "number" ? body.total : rawQuotes.length,
    page: typeof body.page === "number" ? body.page : page,
    limit: typeof body.limit === "number" ? body.limit : limit,
  };
}
