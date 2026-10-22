/* ==========================================================================
   Editorial + pricing copy for /hosting. Ported verbatim from hosting.html —
   the chp-card markup (plan names, feature lists) and the data-monthly/
   data-yearly/data-twoyear/data-yearly(effective)/data-twoyear(effective)
   attributes on .chp-price-value / .chp-price-effective, which drive the
   billing-cycle toggle. These are the exact recurring prices configured in
   FOSSBilling, not placeholder numbers, so they must not drift from the
   legacy page without also updating FOSSBilling.

   Page-local, like careers/content.ts — nothing else in the app needs a
   hosting plan list, so it lives beside the page rather than in a JSON file.
   ========================================================================== */

import type { HostingProductKey } from "@/lib/kzd-integration";

export type BillingPeriod = "monthly" | "yearly" | "twoyear";

export const BILLING_LABELS: Record<BillingPeriod, string> = {
  monthly: "/month",
  yearly: "/year",
  twoyear: "/2 years",
};

export type PlanFeature = {
  text: string;
  tooltip?: string;
};

export type HostingPlan = {
  key: HostingProductKey;
  name: string;
  description: string;
  monthly: number;
  yearly: number;
  twoyear: number;
  /** Effective per-month rate shown once yearly/twoyear is selected. */
  effectiveYearly: number;
  effectiveTwoyear: number;
  features: PlanFeature[];
  active?: boolean;
};

const FREE_DOMAIN_TOOLTIP = "Included with annual hosting plans only.";

export const HOSTING_PLANS: HostingPlan[] = [
  {
    key: "hostingStarter",
    name: "Starter",
    description: "Great for personal sites and small projects",
    monthly: 99,
    yearly: 990,
    twoyear: 1881,
    effectiveYearly: 82.5,
    effectiveTwoyear: 78.38,
    features: [
      { text: "2 GB SSD Storage" },
      { text: "DirectAdmin Control Panel" },
      { text: "1 Website" },
      { text: "5 Subdomains" },
      { text: "Free .co.za Domain", tooltip: FREE_DOMAIN_TOOLTIP },
      { text: "Free SSL Certificate" },
      { text: "10 Email Accounts" },
      { text: "2 FTP Accounts" },
      { text: "5 MySQL Databases" },
      { text: "Weekly Backups" },
      { text: "Standard Support" },
    ],
  },
  {
    key: "hostingBasic",
    name: "Basic",
    description: "A step up for growing sites",
    monthly: 149,
    yearly: 1490,
    twoyear: 2831,
    effectiveYearly: 124.17,
    effectiveTwoyear: 117.96,
    features: [
      { text: "4 GB SSD Storage" },
      { text: "DirectAdmin Control Panel" },
      { text: "2 Websites" },
      { text: "7 Subdomains" },
      { text: "Free .co.za Domain", tooltip: FREE_DOMAIN_TOOLTIP },
      { text: "Free SSL Certificate" },
      { text: "15 Email Accounts" },
      { text: "5 FTP Accounts" },
      { text: "10 MySQL Databases" },
      { text: "Weekly Backups" },
      { text: "Standard Support" },
    ],
  },
  {
    key: "hostingStandard",
    name: "Standard",
    description: "Our most popular plan for small businesses",
    monthly: 199,
    yearly: 1990,
    twoyear: 3781,
    effectiveYearly: 165.83,
    effectiveTwoyear: 157.54,
    active: true,
    features: [
      { text: "7 GB SSD Storage" },
      { text: "DirectAdmin Control Panel" },
      { text: "5 Websites" },
      { text: "9 Subdomains" },
      { text: "Free .co.za Domain", tooltip: FREE_DOMAIN_TOOLTIP },
      { text: "Free SSL Certificate" },
      { text: "25 Email Accounts" },
      { text: "10 FTP Accounts" },
      { text: "20 MySQL Databases" },
      { text: "Weekly Backups" },
      { text: "Standard Support" },
    ],
  },
  {
    key: "hostingBusiness",
    name: "Business",
    description: "For growing businesses and multiple sites",
    monthly: 299,
    yearly: 2990,
    twoyear: 5681,
    effectiveYearly: 249.17,
    effectiveTwoyear: 236.71,
    features: [
      { text: "15 GB SSD Storage" },
      { text: "DirectAdmin Control Panel" },
      { text: "10 Websites" },
      { text: "15 Subdomains" },
      { text: "Free .co.za Domain", tooltip: FREE_DOMAIN_TOOLTIP },
      { text: "Free SSL Certificate" },
      { text: "50 Email Accounts" },
      { text: "20 FTP Accounts" },
      { text: "50 MySQL Databases" },
      { text: "Weekly Backups" },
      { text: "Priority Support" },
    ],
  },
] as const;

export type EmailPlan = {
  key: HostingProductKey;
  name: string;
  description: string;
  monthlyPrice: number;
  features: string[];
};

export const EMAIL_PLANS: EmailPlan[] = [
  {
    key: "businessEmail",
    name: "Business Email",
    description: "For businesses that only need email",
    monthlyPrice: 79,
    features: [
      "Professional Email",
      "25 Email Accounts",
      "Webmail Access",
      "Outlook Support",
      "Mobile Phone Support",
      "Spam Filtering",
      "Secure SSL Connections",
    ],
  },
  {
    key: "premiumBusinessEmail",
    name: "Premium Business Email",
    description: "For businesses with larger teams",
    monthlyPrice: 149,
    features: [
      "100 Email Accounts",
      "Larger Mail Storage",
      "Outlook Support",
      "Mobile Support",
      "Webmail",
      "Spam Protection",
      "DKIM & SPF Email Security",
    ],
  },
] as const;

export const FAQ_ITEMS = [
  {
    id: "hosting-faq-different",
    question: "What makes KZD Solutions web hosting different?",
    answer:
      "Every plan runs on SSD storage with the DirectAdmin control panel, free SSL, and daily backups included as standard, not as an upsell.",
  },
  {
    id: "hosting-faq-upgrade",
    question: "Can I upgrade my plan later?",
    answer:
      "Yes. You can move between Starter, Business, and Pro at any time as your site grows, with no downtime during the upgrade.",
  },
  {
    id: "hosting-faq-migration",
    question: "Is migration from my current host included?",
    answer: "Yes, free migrations are included with every web hosting plan.",
  },
] as const;

export const WHY_CARDS = [
  {
    title: "Reliable Uptime",
    body: "99.99% uptime guarantee to keep your website always available.",
  },
  {
    title: "Secure & Protected",
    body: "SSL certificates, firewalls, and automated backups keep your data safe.",
  },
  {
    title: "24/7 Support",
    body: "Our expert team is available round the clock to assist you with any issue.",
  },
  {
    title: "Fast Performance",
    body: "Optimized servers and caching technology for lightning-fast load times.",
  },
] as const;
