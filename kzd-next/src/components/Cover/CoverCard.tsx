/* Shared card byline and cover framing, used by the blog index and by the
   related strip on an article. Server Component — no interactivity. */

import Link from "next/link";
import Cover from "@/components/Cover/Cover";
import { formatDate, readingMinutes, type Post } from "@/lib/content";
import styles from "@/app/blog/blog.module.css";

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link className={styles.card} href={`/blog/${post.slug}`}>
      <div className={styles.cover}>
        <Cover
          seed={post.cover?.seed ?? post.slug}
          title={post.title}
          className={styles.coverSvg}
        />
      </div>
      <p className={styles.cat}>{post.category}</p>
      <h3 className={styles.cardTitle}>{post.title}</h3>
      <p className={styles.cardExcerpt}>{post.excerpt}</p>
      <p className={styles.meta}>
        {formatDate(post.publishedAt)} — {readingMinutes(post)} min read
      </p>
    </Link>
  );
}
