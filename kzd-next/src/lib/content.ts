/* ==========================================================================
   THE ONLY PLACE CONTENT IS READ.

   Every page gets its posts, jobs and reviews through this module. Nothing
   else imports the JSON, opens a file, or knows where the content lives — a
   grep for readFileSync or "data/" outside this file should come back empty.

   That matters because this is the seam Payload slots into. When the CMS
   lands, the bodies of these functions become fetches against the Payload API
   and every caller stays exactly as it is:

     getPosts()  ->  payload.find({ collection: "posts" })
     getPost(s)  ->  payload.find({ collection: "posts", where: { slug: { equals: s } } })
     getJobs()   ->  payload.find({ collection: "jobs" })

   The block-array body model is deliberately Payload's block-field shape, so
   the article renderer needs no change either.

   Reads happen at build time. These are synchronous on purpose: they run
   inside Server Components during the build, never in response to a request,
   so there is no request-path cost to pay for async plumbing. The functions
   are still declared to return plain values rather than promises; when they
   become network calls they become async, and the callers already await
   nothing they cannot await.
   ========================================================================== */

import { readFileSync } from "node:fs";
import path from "node:path";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

/** Mirrors posts.json `_blockTypes`. Anything outside this union is ignored by
    the renderer rather than trusted — see ArticleBody. */
export type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] };

export type Post = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  author: string;
  seo: { metaTitle: string; metaDescription: string; keywords: string[] };
  cover: { type: string; seed?: string };
  body: Block[];
};

export type JobStatus = "open" | "closed";

export type Job = {
  id: string;
  title: string;
  location: string;
  type: string;
  department: string;
  status: JobStatus;
  summary: string;
  detail: {
    description: string[];
    why: { title: string; body: string }[];
    workOn: string[];
    lookingFor: string[];
    niceToHave: string[];
    offer: { title: string; body: string }[];
  };
};

export type Review = {
  author: string;
  rating: number;
  text: string;
  date?: string;
  initial?: string;
};

export type ReviewSummary = {
  businessName: string;
  rating: number;
  totalReviews: number;
  reviewUrl: string;
  readAllUrl: string;
  reviews: Review[];
};

/* -------------------------------------------------------------------------- */
/* Reading                                                                     */
/* -------------------------------------------------------------------------- */

const DATA_DIR = path.join(process.cwd(), "src", "data");

/* Cached per module instance. During a build this reads each file once no
   matter how many of the six article pages ask for it. */
const cache = new Map<string, unknown>();

function readJson<T>(file: string): T {
  const hit = cache.get(file);
  if (hit) return hit as T;
  const parsed = JSON.parse(readFileSync(path.join(DATA_DIR, file), "utf8")) as T;
  cache.set(file, parsed);
  return parsed;
}

/* -------------------------------------------------------------------------- */
/* Posts                                                                       */
/* -------------------------------------------------------------------------- */

/** Newest first. Anything without a slug and a title is dropped rather than
    rendered half-formed. */
export function getPosts(): Post[] {
  const { posts } = readJson<{ posts: Post[] }>("posts.json");
  return posts
    .filter((p) => p && p.slug && p.title)
    .slice()
    .sort((a, b) => String(b.publishedAt ?? "").localeCompare(String(a.publishedAt ?? "")));
}

export function getPost(slug: string): Post | null {
  return getPosts().find((p) => p.slug === slug) ?? null;
}

/** Derived from the data, never a hardcoded list, so a new category in
    posts.json appears in the filter with no code change. */
export function getCategories(): string[] {
  return [...new Set(getPosts().map((p) => p.category).filter(Boolean))];
}

/** Same category first, topped up with the most recent if that is thin. */
export function getRelated(post: Post, n = 3): Post[] {
  const posts = getPosts();
  const sameCategory = posts.filter((p) => p.slug !== post.slug && p.category === post.category);
  if (sameCategory.length >= n) return sameCategory.slice(0, n);

  const picked = [...sameCategory];
  for (const p of posts) {
    if (picked.length >= n) break;
    if (p.slug === post.slug || picked.includes(p)) continue;
    picked.push(p);
  }
  return picked.slice(0, n);
}

const WORDS_PER_MINUTE = 200;

/** Words across every block that carries text. */
export function wordCount(post: Post): number {
  let n = 0;
  for (const block of post.body ?? []) {
    if ("text" in block && typeof block.text === "string") {
      n += block.text.trim().split(/\s+/).filter(Boolean).length;
    }
    if ("items" in block && Array.isArray(block.items)) {
      for (const item of block.items) n += String(item).trim().split(/\s+/).filter(Boolean).length;
    }
  }
  return n;
}

/**
 * Always computed. posts.json deliberately carries no readingMinutes field: a
 * stored value drifts the moment the text is edited, and a confidently wrong
 * number is worse than no number at all.
 */
export function readingMinutes(post: Post): number {
  return Math.max(1, Math.round(wordCount(post) / WORDS_PER_MINUTE));
}

/* -------------------------------------------------------------------------- */
/* Jobs                                                                        */
/* -------------------------------------------------------------------------- */

/** Open roles first — a closed role still has a page, but it should not sit
    above one someone can actually apply for. */
export function getJobs(): Job[] {
  const { roles } = readJson<{ roles: Job[] }>("careers.json");
  return roles
    .filter((r) => r && r.id && r.title)
    .slice()
    .sort((a, b) => Number(b.status === "open") - Number(a.status === "open"));
}

export function getJob(id: string): Job | null {
  return getJobs().find((r) => r.id === id) ?? null;
}

export function getDepartments(): string[] {
  return [...new Set(getJobs().map((r) => r.department).filter(Boolean))];
}

/* -------------------------------------------------------------------------- */
/* Reviews                                                                     */
/* -------------------------------------------------------------------------- */

export function getReviews(): ReviewSummary {
  return readJson<ReviewSummary>("reviews.json");
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "12 Feb 2026". Built from the ISO parts rather than toLocaleDateString so
    the build machine's locale and timezone cannot change what ships. */
export function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]} ${y}`;
}
