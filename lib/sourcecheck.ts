// Automated source check for submissions: pull every numeric claim out of an entry, fetch its
// sources safely, and report where (or whether) each claim appears. Mirrors the manual audits of
// the seed data: match numbers *with their units*, show the sentence, flag claims that only appear
// in a later source, and give the tail sentence of each section extra scrutiny.

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// ---------- claims ----------

export type Claim = {
  field: string; // headline_metric, outcome, summary, ...
  text: string; // as written in the entry, e.g. "72.9%"
  num: string; // digits only, commas removed, e.g. "72.9"
  unit: string; // normalized: "%", "x", "million", "k", "points", "hours", ... or ""
  tail: boolean; // in the last sentence of a multi-sentence section
  hedged: boolean; // the sentence itself says the figure is unverified or varies
  key: boolean; // has a unit or currency, is 100+, or is the headline: worth a reviewer's attention
  approx: boolean; // "more than 11 million": allow a more precise figure in the source
  context: string; // the sentence it came from
};

const HEDGE = /could not be verified|couldn.t be verified|not verified|unverified|vary|varies|not given|not reported|disputed|retellings|other sources cite/i;
const APPROX = /(more than|over|about|around|nearly|almost|roughly|approximately|close to|~)\s*[$£€]?$/i;

const FIELDS = ["headline_metric", "summary", "outcome", "insight", "change", "research", "problem", "caveats"] as const;

const UNIT_WORDS: Record<string, string> = {
  "%": "%",
  percent: "%",
  "per cent": "%",
  x: "x",
  "×": "x",
  times: "x",
  million: "million",
  m: "million",
  mn: "million",
  billion: "billion",
  bn: "billion",
  b: "billion",
  k: "k",
  thousand: "k",
  "percentage points": "points",
  "percentage point": "points",
  points: "points",
  pts: "points",
  pp: "points",
  hours: "hours",
  hour: "hours",
  minutes: "minutes",
  minute: "minutes",
  mins: "minutes",
  seconds: "seconds",
  second: "seconds",
  days: "days",
  day: "days",
  weeks: "weeks",
  months: "months",
};

const NUM_RE =
  /(?<![\w.])([$£€]?)(\d[\d,]*(?:\.\d+)?)(?:\s?(percentage points?|per cent|percent|%|×|x\b|times\b|million\b|billion\b|thousand\b|mn\b|bn\b|k\b|m\b|b\b|points?\b|pts\b|pp\b|hours?\b|minutes?\b|mins\b|seconds?\b|days?\b|weeks\b|months\b))?/gi;

function sentences(s: string): string[] {
  return s
    .split(/(?<=[.!?])\s+(?=[A-Z“"'(])/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function extractClaims(entry: Record<string, unknown>): Claim[] {
  const out: Claim[] = [];
  const seen = new Set<string>();
  for (const field of FIELDS) {
    const raw = entry[field];
    if (typeof raw !== "string" || !raw.trim()) continue;
    const sents = sentences(raw);
    sents.forEach((sent, si) => {
      for (const m of sent.matchAll(NUM_RE)) {
        const num = m[2].replace(/,/g, "").replace(/\.$/, "");
        const unit = m[3] ? UNIT_WORDS[m[3].toLowerCase()] ?? "" : "";
        // Skip years, and bare small integers that are almost always ordinals or counts in prose.
        if (!unit && !m[1] && /^(19|20)\d\d$/.test(num)) continue;
        if (!unit && !m[1] && /^\d$/.test(num)) continue;
        // p-values and scale endpoints like "7-point" are noise for this check.
        if (/p\s*[=<]\s*$/i.test(sent.slice(0, m.index))) continue;
        const key = `${field}|${num}|${unit}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          field,
          text: m[0].trim(),
          num,
          unit,
          tail: field !== "headline_metric" && sents.length > 1 && si === sents.length - 1,
          hedged: HEDGE.test(sent),
          key: field === "headline_metric" || !!unit || !!m[1] || /^\d{3,}$/.test(num),
          approx: m[2].indexOf(".") === -1 && APPROX.test(sent.slice(0, m.index)),
          context: sent,
        });
      }
    });
  }
  return out;
}

// Words that stand in for multipliers in prose: "doubled", "four times faster".
const MULT_WORDS: Record<string, string> = {
  "2": "doubl\\w*|twice|two times|2 times",
  "3": "tripl\\w*|three times|3 times",
  "4": "quadrupl\\w*|four times|4 times",
  "5": "five times|5 times",
  "10": "ten times|10 times|tenfold",
};
const NUM_WORDS: Record<string, string> = { "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten" };

function claimPattern(c: Claim): RegExp {
  const n = c.num.replace(/\./g, "\\.");
  const numAlt = NUM_WORDS[c.num] ? `(?:${n}|\\b${NUM_WORDS[c.num]}\\b)` : n;
  const unit: Record<string, string> = {
    "%": "\\s?(?:%|percent|per cent)",
    x: "\\s?(?:x\\b|×|times)",
    million: "\\s?(?:million|m\\b|mn\\b|,?000,?000)",
    billion: "\\s?(?:billion|bn\\b|b\\b)",
    k: "\\s?(?:k\\b|,?000\\b|thousand)",
    points: "\\s?(?:percentage points?|points?|pts|pp)",
  };
  const u = c.unit ? unit[c.unit] ?? `\\s?${c.unit.replace(/s$/, "")}s?` : "";
  const dec = c.approx ? "(?:\\.\\d+)?" : "";
  let body = `(?<![\\d.])${numAlt}${dec}(?![\\d])${u}`;
  if (c.unit === "x" && MULT_WORDS[c.num]) body = `(?:${body}|${MULT_WORDS[c.num]})`;
  // "100k" should also match "100,000" (commas are stripped from source text before matching).
  if (c.unit === "k") body = `(?:${body}|(?<![\\d.])${n}000(?![\\d]))`;
  if (c.unit === "million") body = `(?:${body}|(?<![\\d.])${n}000000(?![\\d]))`;
  return new RegExp(body, "i");
}

// ---------- fetching ----------

export type SourceStatus = "ok" | "blocked" | "dead" | "error" | "unsafe";

export type FetchedSource = {
  url: string;
  finalUrl: string;
  status: SourceStatus;
  httpStatus: number | null;
  kind: "html" | "pdf" | "rss" | "none";
  title: string | null;
  note: string | null;
  pages: string[]; // text per page (PDF) or a single entry (HTML)
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const MAX_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 12_000;

function privateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return privateIp(v.slice(7));
  return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
}

// Refuse anything that isn't a public http(s) host. Checked on every redirect hop.
async function assertPublicUrl(u: URL): Promise<void> {
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("only http(s) links are checked");
  if (u.username || u.password) throw new Error("links with credentials aren't checked");
  if (u.port && !["80", "443"].includes(u.port)) throw new Error("non-standard ports aren't checked");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (/^(localhost|.*\.local|.*\.internal|metadata\..*)$/i.test(host)) throw new Error("internal host");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new Error("resolves to a private address");
}

async function readCapped(res: Response): Promise<Uint8Array> {
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(Math.min(total, MAX_BYTES));
  let off = 0;
  for (const c of chunks) {
    out.set(c.subarray(0, out.length - off), off);
    off += c.byteLength;
    if (off >= out.length) break;
  }
  return out;
}

async function safeFetch(url: string): Promise<{ res: Response; finalUrl: string }> {
  let current = new URL(url);
  for (let hop = 0; hop < 6; hop++) {
    await assertPublicUrl(current);
    const res = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": UA, accept: "text/html,application/pdf,application/xhtml+xml,*/*;q=0.8", "accept-language": "en-US,en;q=0.9" },
    });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      current = new URL(loc, current);
      continue;
    }
    return { res, finalUrl: current.toString() };
  }
  throw new Error("too many redirects");
}

const decodeEntities = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&pound;/g, "£")
    .replace(/&euro;/g, "€")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));

// Headings become "§id§" markers so a match can point at the nearest section anchor.
export function htmlToText(html: string): { text: string; title: string | null } {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const body = html
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<h[1-4]\b([^>]*)>/gi, (_, attrs: string) => {
      const id = attrs.match(/\bid="([^"]+)"/)?.[1];
      return id ? ` §${id}§ ` : " ";
    })
    .replace(/<span\b[^>]*class="mw-headline"[^>]*\bid="([^"]+)"[^>]*>/gi, " §$1§ ")
    .replace(/<(br|p|div|li|tr|td|th|section|article)\b[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return {
    text: decodeEntities(body).replace(/\s+/g, " ").trim(),
    title: title ? decodeEntities(title).replace(/\s+/g, " ").trim() : null,
  };
}

async function pdfPages(bytes: Uint8Array): Promise<string[]> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: false });
  return (Array.isArray(text) ? text : [text]).map((t) => t.replace(/\s+/g, " "));
}

// Medium blocks automated article fetches; its publication RSS feed carries the full post.
async function mediumViaRss(u: URL): Promise<string | null> {
  const pub = u.pathname.split("/")[1];
  const id = u.pathname.split("-").pop()?.replace(/\/$/, "");
  if (!pub || !id) return null;
  const feedUrl = u.hostname === "medium.com" ? `https://medium.com/feed/${pub}` : `https://${u.hostname}/feed`;
  const { res } = await safeFetch(feedUrl);
  if (!res.ok) return null;
  const xml = new TextDecoder().decode(await readCapped(res));
  for (const item of xml.split("<item>").slice(1)) {
    if (!item.includes(id)) continue;
    return item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] ?? null;
  }
  return null;
}

export async function fetchSource(url: string): Promise<FetchedSource> {
  const base: FetchedSource = { url, finalUrl: url, status: "error", httpStatus: null, kind: "none", title: null, note: null, pages: [] };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ...base, note: "not a valid URL" };
  }
  try {
    const { res, finalUrl } = await safeFetch(url);
    const out: FetchedSource = { ...base, finalUrl, httpStatus: res.status };
    const isMedium = /(^|\.)medium\.com$/i.test(parsed.hostname);
    if (!res.ok) {
      if (isMedium) {
        const rss = await mediumViaRss(parsed).catch(() => null);
        if (rss) {
          const { text } = htmlToText(rss);
          return { ...out, status: "ok", kind: "rss", note: "Read via the publication's RSS feed (Medium blocks automated checks).", pages: [text] };
        }
      }
      if (res.status === 404 || res.status === 410) return { ...out, status: "dead", note: `HTTP ${res.status}: page not found` };
      if ([400, 401, 403, 429, 503].includes(res.status))
        return { ...out, status: "blocked", note: `HTTP ${res.status}: the site blocks automated checks. Open it yourself.` };
      return { ...out, status: "error", note: `HTTP ${res.status}` };
    }
    const bytes = await readCapped(res);
    const type = res.headers.get("content-type") ?? "";
    const isPdf = type.includes("pdf") || new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
    if (isPdf) {
      const pages = await pdfPages(bytes);
      return { ...out, status: "ok", kind: "pdf", pages, note: `PDF, ${pages.length} page${pages.length === 1 ? "" : "s"}` };
    }
    const { text, title } = htmlToText(new TextDecoder().decode(bytes));
    if (/just a moment|checking your browser|attention required|captcha/i.test(title ?? "") || text.length < 200)
      return { ...out, status: "blocked", kind: "html", title, note: "Bot-check page. Open it yourself." };
    if (/not found|404|page (doesn.t|does not) exist|no longer available/i.test(title ?? ""))
      return { ...out, status: "dead", kind: "html", title, note: `Title says “${title}”` };
    return { ...out, status: "ok", kind: "html", title, pages: [text] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/private|internal|only http|credentials|ports/.test(msg)) return { ...base, status: "unsafe", note: `Not fetched: ${msg}. Check this link by hand, carefully.` };
    return { ...base, status: "error", note: /timeout|abort/i.test(msg) ? "Timed out" : msg };
  }
}

// ---------- matching ----------

export type ClaimResult = Claim & {
  found: null | {
    source: number; // index into sources
    page: number | null; // 1-based PDF page
    anchor: string | null; // nearest preceding heading id
    depth: number; // 0..1 position within the source text
    snippet: string;
    hit: string; // the matched text inside the snippet
  };
};

function locate(c: Claim, sources: FetchedSource[]): ClaimResult["found"] {
  const re = claimPattern(c);
  for (let si = 0; si < sources.length; si++) {
    const s = sources[si];
    if (s.status !== "ok") continue;
    const total = s.pages.reduce((n, p) => n + p.length, 0) || 1;
    let before = 0;
    for (let pi = 0; pi < s.pages.length; pi++) {
      const text = s.pages[pi].replace(/(?<=\d),(?=\d{3})/g, "");
      const m = re.exec(text);
      if (m) {
        const at = m.index;
        const anchors = [...text.slice(0, at).matchAll(/§([^§]+)§/g)];
        const snippet = text
          .slice(Math.max(0, at - 140), at + m[0].length + 110)
          .replace(/§[^§]*§/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        return {
          source: si,
          page: s.kind === "pdf" ? pi + 1 : null,
          anchor: anchors.length ? anchors[anchors.length - 1][1] : null,
          depth: (before + at) / total,
          snippet,
          hit: m[0],
        };
      }
      before += s.pages[pi].length;
    }
  }
  return null;
}

const STOP = new Set(
  "the a an of to and for in on with by from as at no not into out its it per vs over more less than new our their".split(" "),
);

export type DecisionResult = { words: { word: string; found: boolean }[] };

function decisionWords(headline: string, sources: FetchedSource[]): DecisionResult {
  const blob = sources
    .filter((s) => s.status === "ok")
    .map((s) => s.pages.join(" "))
    .join(" ")
    .toLowerCase();
  const words = [...new Set(headline.toLowerCase().match(/[a-z]{3,}/g) ?? [])].filter((w) => !STOP.has(w));
  return { words: words.map((w) => ({ word: w, found: new RegExp(`\\b${w.slice(0, Math.max(4, w.length - 2))}`).test(blob) })) };
}

export type SourceCheckReport = {
  checkedAt: string;
  sources: Omit<FetchedSource, "pages">[];
  claims: ClaimResult[];
  decision: DecisionResult | null;
  warnings: string[];
};

export async function runSourceCheck(entry: Record<string, unknown>): Promise<SourceCheckReport> {
  const list = Array.isArray(entry.sources) ? (entry.sources as { url?: unknown }[]) : [];
  const urls = list.map((s) => (typeof s?.url === "string" ? s.url.trim() : "")).filter(Boolean).slice(0, 6);
  const fetched = await Promise.all(urls.map(fetchSource));
  const claims = extractClaims(entry).map((c) => ({ ...c, found: locate(c, fetched) }));

  const headline = typeof entry.headline_metric === "string" ? entry.headline_metric : "";
  const headClaims = claims.filter((c) => c.field === "headline_metric");
  const warnings: string[] = [];

  if (!urls.length) warnings.push("No sources. Nothing to check against; ask the submitter for one, or verify it yourself.");
  for (const [i, s] of fetched.entries()) {
    if (s.status === "dead") warnings.push(`Source ${i + 1} looks dead (${s.note}).`);
  }
  const readable = fetched.filter((s) => s.status === "ok").length;
  const unread = fetched.length - readable;
  if (urls.length && unread)
    warnings.push(
      readable
        ? `${unread} of ${fetched.length} sources couldn't be read automatically. Anything marked “not found” may be in ${unread > 1 ? "those" : "that one"}; open ${unread > 1 ? "them" : "it"} yourself.`
        : "None of the sources could be read automatically. Open them yourself and check every number.",
    );
  if (headClaims.length && readable) {
    const missing = headClaims.filter((c) => !c.found);
    if (missing.length)
      warnings.push(
        `Headline number${missing.length > 1 ? "s" : ""} ${missing.map((c) => `“${c.text}”`).join(", ")} not found in the readable sources. Is it stated, or worked out (e.g. two figures added together)?`,
      );
    else if (headClaims.some((c) => c.found && c.found.source > 0))
      warnings.push("The headline number is only in a later source. Put the source that states it first: citations use the first link.");
    const h = headClaims.find((c) => c.found)?.found;
    if (h) {
      const src = urls[h.source] ?? "";
      const longPage = (fetched[h.source]?.pages.join(" ").length ?? 0) > 20_000;
      if (h.page && h.page > 2 && !/#page=\d+/.test(src))
        warnings.push(`The headline number is on page ${h.page} of a PDF. Link with #page=${h.page}.`);
      else if (!h.page && longPage && h.depth > 0.35 && !src.includes("#")) {
        const chrome = /(^|[-_])(wb|cont|content|main|menu|nav|header|footer|breadcrumb|skip|site|sidebar|toc|cta|block|search|title|donate)([-_]|$)/i;
        warnings.push(
          h.anchor && !chrome.test(h.anchor)
            ? `The headline number is deep in a long page. Consider linking to #${h.anchor}.`
            : "The headline number is deep in a long page. Readers may not find it; link to the section if it has one.",
        );
      }
    }
  }
  const tailMissing = claims.filter((c) => c.key && c.tail && !c.found && !c.hedged);
  if (tailMissing.length && readable)
    warnings.push(
      `${tailMissing.length} number${tailMissing.length > 1 ? "s" : ""} in the last sentence of a section ${tailMissing.length > 1 ? "aren't" : "isn't"} in the readable sources (${tailMissing.map((c) => `“${c.text}”`).join(", ")}). That's where unsupported details usually hide.`,
    );

  return {
    checkedAt: new Date().toISOString(),
    sources: fetched.map(({ pages: _pages, ...rest }) => rest),
    claims,
    decision: headline && !headClaims.length ? decisionWords(headline, fetched) : null,
    warnings: [...new Set(warnings)],
  };
}
