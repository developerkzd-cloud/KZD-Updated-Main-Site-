/* Where every "Case study" button points: the blog, filtered to its case
   study category, anchored on the product or client. Apps (Our products on
   /services) and client websites (the Clients carousel) are two separate
   categories so the blog can list them apart. Kept in one place so the
   blog, once rebuilt, reads the same category names. */

export const CASE_STUDY_CATEGORIES = {
  apps: "App case studies",
  sites: "Website case studies",
} as const;

export type CaseStudyKind = keyof typeof CASE_STUDY_CATEGORIES;

export function caseStudyHref(kind: CaseStudyKind, slug: string): string {
  return `/blog?category=${encodeURIComponent(CASE_STUDY_CATEGORIES[kind])}#${slug}`;
}
