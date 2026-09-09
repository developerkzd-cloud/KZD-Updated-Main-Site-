/* ==========================================================================
   /blog/[slug] — a single article.

   THIS ROUTE IS THE REASON FOR THE MIGRATION.

   On the static site, article.html fetched posts.json in the browser and wrote
   the <title>, description, canonical, Open Graph tags and JSON-LD with
   JavaScript after first paint. Googlebot renders JS and usually saw them; the
   crawlers behind LinkedIn, Facebook, WhatsApp, Slack and X do not, so every
   article shared one generic preview. tools/build-blog.js existed only to work
   around that, prerendering a second copy of every article to /blog/<slug>.html.

   generateMetadata() below replaces the whole arrangement. The tags are in the
   HTML the server sends, so the build script and its output are deleted.

   Next 16: params is a Promise and must be awaited.
   ========================================================================== */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cover from "@/components/Cover/Cover";
import PostCard from "@/components/Cover/CoverCard";
import ShareButton from "./ShareButton";
import {
  formatDate,
  getPost,
  getPosts,
  getRelated,
  readingMinutes,
  wordCount,
  type Block,
} from "@/lib/content";
import styles from "../blog.module.css";

const SITE = "https://kzdsolutions.co.za";

/** Every article is generated at build time, so there is no request-time work
    and no runtime dependency on the JSON. */
export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPost(slug);

  /* A slug with no post gets the not-found metadata rather than a half-filled
     card advertising a page that does not exist. */
  if (!post) return { title: "Article not found" };

  const url = `${SITE}/blog/${post.slug}`;
  const title = post.seo?.metaTitle || post.title;
  const description = post.seo?.metaDescription || post.excerpt;

  return {
    /* `absolute` because seo.metaTitle already carries the "| KZD Solutions"
       suffix the layout template would otherwise append a second time. This
       matches what the static site put in <title>. */
    title: { absolute: title },
    description,
    keywords: post.seo?.keywords,
    authors: [{ name: post.author }],
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "KZD Solutions",
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/* -------------------------------------------------------------------------- */

/** Renders one content block. An unrecognised type is skipped rather than
    guessed at, so content added later cannot inject markup into the page. */
function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph":
      return <p className={styles.p}>{block.text}</p>;
    case "heading":
      return <h2 className={styles.h2}>{block.text}</h2>;
    case "quote":
      return <blockquote className={styles.quote}>{block.text}</blockquote>;
    case "list":
      return (
        <ul className={styles.list}>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

export default async function ArticlePage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getRelated(post, 3);
  const url = `${SITE}/blog/${post.slug}`;

  /* Server-rendered, never injected client-side, so it is in the HTML a
     crawler receives. The < escape is Next's documented guard against a
     "</script>" appearing inside a string in the payload. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo?.metaDescription || post.excerpt,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "KZD Solutions" },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: post.category,
    wordCount: wordCount(post),
    keywords: post.seo?.keywords?.join(", "),
  };

  return (
    <main className={styles.blog}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className={styles.wrap}>
        <div className={styles.measure}>
          <Link className={styles.backLink} href="/blog">
            ← All articles
          </Link>

          <p className={styles.cat}>{post.category}</p>
          <h1 className={styles.title}>{post.title}</h1>
          <p className={styles.excerpt}>{post.excerpt}</p>

          <div className={styles.bylineRow}>
            <div className={`${styles.byline} ${styles.bylineLg}`}>
              <span className={styles.avatar} aria-hidden="true">
                {post.author.charAt(0)}
              </span>
              <span>
                <span className={styles.author}>{post.author}</span>
                <span className={styles.bylineSub}>
                  {formatDate(post.publishedAt)} — {readingMinutes(post)} min read
                </span>
              </span>
            </div>
            <ShareButton url={url} />
          </div>

          <figure className={styles.figure}>
            <div className={`${styles.cover} ${styles.coverArticle}`}>
              <Cover
                seed={post.cover?.seed ?? post.slug}
                title={post.title}
                className={styles.coverSvg}
                priority
              />
            </div>
          </figure>

          <div className={styles.body}>
            {post.body.map((block, i) => (
              <BlockView key={i} block={block} />
            ))}
          </div>

          <aside className={styles.cta}>
            <div className={styles.ctaText}>
              <p className={styles.ctaTitle}>Want this looked at in your business?</p>
              <p className={styles.ctaBody}>
                We map where the hours actually go, then fix the two or three things that recover
                the most of them.
              </p>
            </div>
            <Link className={styles.ctaBtn} href="/contact">
              Talk to us
            </Link>
          </aside>
        </div>

        {related.length > 0 && (
          <section className={styles.relatedHost}>
            <h2 className={styles.relatedHead}>More from KZD Insights</h2>
            <div className={styles.grid}>
              {related.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
