/* ==========================================================================
   /services — static content:
     - the four "Our services" tabs (SERVICE_TABS)
     - Our Products
     - Our clients (CLIENTS; also rendered on the homepage)
   ========================================================================== */

export const CONSULTING_LIST = [
  "Lean Manufacturing Consulting",
  "Process Improvement",
  "Scaling and Automation",
  "Business Analysis",
  "Systems Training",
];

export type ServiceTab = {
  id: string;
  name: string;
  /** One line under the tab name. */
  tagline: string;
  /** The detail card's intro line. */
  intro: string;
  rows: { label: string; href: string }[];
  cta: { label: string; href: string };
};

const consult = { label: "Book a free consultation", href: "/contact" };

/* Rows link to their page where one exists (or its coming-soon page), and to
   /contact otherwise, until each gets its own page. */
export const SERVICE_TABS: ServiceTab[] = [
  {
    id: "consulting",
    name: "Consulting",
    tagline: "Advice that sharpens how your business is run.",
    intro: "We help businesses find waste, fix process and scale what already works.",
    rows: CONSULTING_LIST.map((label) => ({ label, href: "/contact" })),
    cta: consult,
  },
  {
    id: "development",
    name: "Development",
    tagline: "The software, sites and infrastructure you run on.",
    intro: "We build and maintain the software, sites and infrastructure your business runs on.",
    rows: [
      { label: "Website Development", href: "/contact" },
      { label: "Software Development", href: "/contact" },
      { label: "Web Design", href: "/contact" },
      { label: "Web Hosting", href: "/hosting" },
      { label: "Domain Registration", href: "/domains/register" },
      { label: "IT Support & Maintenance", href: "/services/it-support" },
    ],
    cta: consult,
  },
  {
    id: "telecommunications",
    name: "Telecommunications",
    tagline: "Connectivity and communications for your business.",
    intro: "Business voice, data and connectivity, set up and managed for you. Launching soon.",
    rows: ["Business phone lines", "Fibre and LTE connectivity", "VoIP and cloud PBX", "Office network setup"].map(
      (label) => ({ label, href: "/services/telecommunications" })
    ),
    cta: { label: "Get notified at launch", href: "/services/telecommunications" },
  },
  {
    id: "ai-builder",
    name: "AI Builder",
    tagline: "Describe your business, get a real website for free.",
    intro: "Our AI writes the copy, picks real photography, and builds a complete website from one description. Try it free; you only pay if you host it with us.",
    rows: ["Real AI-written copy", "Real photography, not placeholders", "Live in minutes", "Free to try, no sign-up"].map(
      (label) => ({ label, href: "/services/ai-builder" })
    ),
    cta: { label: "Build your website with AI", href: "/services/ai-builder" },
  },
];

export type Product = {
  slug: string;
  name: string;
  category: string;
  href: string;
  image: string;
  copy: string;
};

export const PRODUCTS: Product[] = [
  {
    slug: "kzdcares",
    name: "KZD CARES",
    category: "Health",
    href: "https://play.google.com/store/apps/details?id=com.kzdcares.patient&hl=en_ZA",
    image: "/Assets/products/kzdcares.png",
    copy: "Health information management system connecting stakeholders and enabling real-time decision-making. Solves inefficiencies with automation, transparency and trust.",
  },
  {
    slug: "dc-delivery",
    name: "DC Delivery",
    category: "Logistics",
    href: "https://play.google.com/store/apps/details?id=com.dcDelivery.customer&hl=en",
    image: "/Assets/products/dc-delivery.png",
    copy: "DC Delivery app enhances logistics efficiency in the competitive food delivery market. Serves an underdeveloped regional market with high growth potential.",
  },
  {
    slug: "schoolmia",
    name: "Schoolmia",
    category: "Education",
    href: "https://schoolmia.com/",
    image: "/Assets/products/schoolmia.png",
    copy: "Empowering schools through seamless management and admissions, from enrolment to day-to-day administration.",
  },
];

export type Client = {
  slug: string;
  domain: string;
  category: string;
  name: string;
  description: string;
  status: "live" | "soon";
  /** Screenshot path when it isn't the default /images/clients/<slug>.jpg. */
  image?: string;
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
  {
    slug: "stylesbycebs",
    domain: "stylesbycebs.co.za",
    category: "Fashion & Eyewear",
    name: "Styles By Cebs",
    description: "Online sunglasses store with featured frames, quick add to cart and delivery across South Africa",
    status: "live",
    image: "/images/clients/stylesbycebs.png",
  },
  {
    slug: "welkinoars",
    domain: "welkinoars.co.za",
    category: "Legal & Professional",
    name: "Welkin Oars",
    description: "Store for editable contracts, policies and legal guides, paid by card or EFT and downloaded instantly",
    status: "live",
    image: "/images/clients/welkinoars.png",
  },
  {
    slug: "sktradingstore",
    domain: "sktradingstore.co.za",
    category: "Beauty & Hair",
    name: "SK Trading Store",
    description: "Online store and salon for wigs, weaves and hair extensions, with salon booking in Durban North",
    status: "live",
    image: "/images/clients/sktradingstore.png",
  },
];
