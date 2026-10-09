/* ==========================================================================
   /services — static content, ported verbatim from services.html:
     - the two accordion panels (Consulting / Development)
     - Our Products (js/kzd-products.js source markup)
     - Our clients (the CLIENTS array in js/kzd-showcase.js — shared with
       index.html and about.html, so this list must stay in step with theirs)
   ========================================================================== */

export const CONSULTING_LIST = [
  "Lean Manufacturing Consulting",
  "Process Improvement",
  "Scaling and Automation",
  "Business Analysis",
  "Systems Training",
];

export const DEVELOPMENT_LIST = [
  "Website Development",
  "Software Development",
  "Web Design",
  "Web Hosting",
  "Domain Registration",
  "IT Support & Maintenance",
];

export type Product = {
  slug: string;
  name: string;
  href: string;
  image: string;
  alt: string;
  copy: string;
};

export const PRODUCTS: Product[] = [
  {
    slug: "kzdcares",
    name: "KZD CARES",
    href: "https://play.google.com/store/apps/details?id=com.kzdcares.patient&hl=en_ZA",
    image: "/Assets/products/kzdcares.png",
    alt: "KZD CARES — open on Google Play, opens in a new tab",
    copy: "Health information management system connecting stakeholders and enabling real-time decision-making. Solves inefficiencies with automation, transparency and trust.",
  },
  {
    slug: "dc-delivery",
    name: "DC Delivery",
    href: "https://play.google.com/store/apps/details?id=com.dcDelivery.customer&hl=en",
    image: "/Assets/products/dc-delivery.png",
    alt: "DC Delivery — open on Google Play, opens in a new tab",
    copy: "DC Delivery app enhances logistics efficiency in the competitive food delivery market. Serves an underdeveloped regional market with high growth potential.",
  },
  {
    slug: "schoolmia",
    name: "Schoolmia",
    href: "https://schoolmia.com/",
    image: "/Assets/products/schoolmia.png",
    alt: "Schoolmia — open the Schoolmia website, opens in a new tab",
    copy: "Empowering schools through seamless management and admissions — from enrolment to day-to-day administration.",
  },
];

export type Client = {
  slug: string;
  domain: string;
  category: string;
  name: string;
  description: string;
  status: "live" | "soon";
};

export const CLIENTS: Client[] = [
  {
    slug: "salonsupplyco",
    domain: "salonsupplyco.co.za",
    category: "Retail & E-commerce",
    name: "Salon Supply Co",
    description:
      "Online store for salon furniture and equipment, with full checkout and branches in Durban and Johannesburg",
    status: "live",
  },
  {
    slug: "keitsleighprimary",
    domain: "keitsleighprimary.co.za",
    category: "Education",
    name: "Keitsleigh Primary School",
    description: "School website and admissions portal, with online applications and parent logins",
    status: "live",
  },
  {
    slug: "computergarden",
    domain: "computergarden.co.za",
    category: "Retail & Technology",
    name: "Computer Garden",
    description: "Website for a computer sales and repair business, built for speed and easy contact",
    status: "live",
  },
  {
    slug: "nockybeauty",
    domain: "nockybeauty.co.za",
    category: "Beauty & Wellness",
    name: "Nocky Beauty",
    description: "Salon website showcasing treatments, with online appointment booking",
    status: "live",
  },
  {
    slug: "farmboyfarmgirl",
    domain: "farmboyfarmgirlbrands.co.za",
    category: "Fashion",
    name: "Farmboy Farmgirl",
    description: "Online store for a clothing and leather goods brand, with full checkout",
    status: "live",
  },
  {
    slug: "philfabulous",
    domain: "philfabulous.co.za",
    category: "Beauty & E-commerce",
    name: "Phil-Fabulous",
    description: "Spa and beauty website with treatments, online shop and appointment booking",
    status: "soon",
  },
];
