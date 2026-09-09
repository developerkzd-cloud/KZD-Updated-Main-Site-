/* The lead article on the blog index — the same post as a card, drawn larger.
   Server Component. Kept beside PostCard because the two are always rendered
   as a pair: the active filter decides which of them a post appears as. */

import Link from "next/link";
import Cover from "@/components/Cover/Cover";
import { formatDate, readingMinutes, type Post } from "@/lib/content";
import styles from "@/app/blog/blog.module.css";

export default function FeaturedPost({ post }: { post: Post }) {
  return (
    <Link className={styles.featured} href={`/blog/${post.slug}`}>
      <div className={`${styles.cover} ${styles.coverFeatured}`}>
        <Cover
          seed={post.cover?.seed ?? post.slug}
          title={post.title}
          className={styles.coverSvg}
          priority
        />
      </div>
      <div className={styles.featuredBody}>
        <p className={styles.cat}>{post.category}</p>
        <h2 className={styles.featuredTitle}>{post.title}</h2>
        <p className={styles.featuredExcerpt}>{post.excerpt}</p>
        <div className={styles.byline}>
          <span className={styles.avatar} aria-hidden="true">{post.author.charAt(0)}</span>
          <span>
            <span className={styles.author}>{post.author}</span>
            <span className={styles.bylineSub}>
              {formatDate(post.publishedAt)} — {readingMinutes(post)} min read
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
