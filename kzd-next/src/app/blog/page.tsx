/* ==========================================================================
   /blog — the index.

   A Server Component. Every card, the lead article, and every SVG cover inside
   them is rendered here and shipped as HTML. The static site fetched
   posts.json in the browser and built all of this with document.createElement,
   so a crawler with no JavaScript got an empty page; the same view here is
   complete before any script runs.

   PostFilter is the only client code on the route. Each post is handed to it
   twice — once as the featured treatment, once as a card — because the active
   filter decides which form a post takes, and doing that swap on the client
   would otherwise mean shipping the card markup as JavaScript.
   ========================================================================== */

import type { Metadata } from "next";
import FeaturedPost from "@/components/Cover/FeaturedPost";
import PostCard from "@/components/Cover/CoverCard";
import PostFilter from "./PostFilter";
import { getCategories, getPosts } from "@/lib/content";
import styles from "./blog.module.css";

const DESCRIPTION =
  "Practical guides for South African business — real operational problems, and what actually fixes them.";

export const metadata: Metadata = {
  title: "Blog",
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    title: "Blog | KZD Solutions",
    description: DESCRIPTION,
    siteName: "KZD Solutions",
  },
};

export default function BlogIndexPage() {
  const posts = getPosts();
  const categories = getCategories();

  return (
    <main className={styles.blog}>
      <div className={styles.wrap}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>KZD Insights</p>
          <h1 className={styles.h1}>Practical guides for South African business</h1>
          <p className={styles.sub}>Real operational problems, and what actually fixes them.</p>
          <p className={styles.sub}>Written for owners and managers, not consultants.</p>
        </header>

        <PostFilter
          categories={categories}
          /* data-category is what PostFilter matches the active pill against. */
          featuredSlots={posts.map((post) => (
            <div key={post.slug} data-category={post.category}>
              <FeaturedPost post={post} />
            </div>
          ))}
          cardSlots={posts.map((post) => (
            <div key={post.slug} data-category={post.category}>
              <PostCard post={post} />
            </div>
          ))}
        />
      </div>
    </main>
  );
}
