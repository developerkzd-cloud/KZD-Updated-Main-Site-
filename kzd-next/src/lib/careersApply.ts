/* ==========================================================================
   Careers application rules, shared by the form (ApplicationForm.tsx) and
   the route that receives it (api/careers/apply), so the browser and the
   server never disagree about what is allowed.
   ========================================================================== */

export const MB = 1024 * 1024;

export const CV_MAX_BYTES = 5 * MB;
export const QUALIFICATIONS_MAX_BYTES = 10 * MB;
export const QUALIFICATIONS_MAX_FILES = 10;

const PDF = "application/pdf";
const WORD = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const IMAGES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export const CV_TYPES = [PDF, ...WORD];
export const CV_EXTENSIONS = [".pdf", ".doc", ".docx"];
export const QUALIFICATION_TYPES = [PDF, ...IMAGES];
export const QUALIFICATION_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic"];

export const EXPERIENCE_OPTIONS = [
  "WordPress",
  "WooCommerce",
  "PHP",
  "Git",
  "Figma or Penpot",
  "Hosting and DNS",
] as const;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** South African numbers: 0XX XXX XXXX or +27 XX XXX XXXX, spaces or dashes optional. */
export const PHONE_RE = /^(\+27|0)[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{4}$/;

/** Some browsers leave File.type empty (notably .docx and .heic on Windows),
    so the extension is the fallback. */
export function fileAllowed(file: { name: string; type: string }, types: string[], extensions: string[]): boolean {
  if (file.type && types.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return extensions.some((ext) => name.endsWith(ext));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}
