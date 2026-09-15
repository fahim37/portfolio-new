export type ShowcaseImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export type ShowcaseProject = {
  id: string;
  number: string;
  title: string;
  type: string;
  url: string;
  description: string;
  cover: ShowcaseImage;
  media: ShowcaseImage[];
  links: { label: string; url: string }[];
  highlights?: string[];
  tech?: string[];
  stackDetails?: { label: string; value: string }[];
  agent?: { label: string; actions: string[]; note: string };
};

const gclStorefront: ShowcaseImage = {
  src: "/projects/gcl-storefront-showcase.webp",
  width: 1600,
  height: 822,
  alt: "GCL E-Commerce storefront homepage",
};

const evpHomepage: ShowcaseImage = {
  src: "/projects/evp-homepage-showcase.webp",
  width: 1600,
  height: 826,
  alt: "Elevator Video Pitch homepage",
};

const gtenWebsite: ShowcaseImage = {
  src: "/projects/gten-bespoke-showcase.webp",
  width: 1600,
  height: 800,
  alt: "G-TEN Bespoke tailoring website",
};

const pathwayWebsite: ShowcaseImage = {
  src: "/projects/prophetic-pathway-showcase.png",
  width: 1672,
  height: 941,
  alt: "Prophetic Pathway website",
};

const diamondWebsite: ShowcaseImage = {
  src: "/projects/diamond-auctions-showcase.png",
  width: 1672,
  height: 941,
  alt: "Diamond Auctions marketplace",
};

const walkthroughzWebsite: ShowcaseImage = {
  src: "/projects/walk-throughz-showcase.png",
  width: 1672,
  height: 941,
  alt: "Walk Throughz location discovery website",
};

export const projects: ShowcaseProject[] = [
  {
    id: "gcl-e-commerce",
    number: "01",
    title: "GCL E-Commerce",
    type: "AI agent commerce platform",
    url: "https://gcl-ecom.vercel.app",
    description:
      "A multi-vendor marketplace for Bangladesh with an AI agent that shops through chat. One cart splits into vendor orders, with bKash and COD payments, dedicated admin and vendor workspaces, and a full store builder.",
    cover: gclStorefront,
    media: [
      gclStorefront,
      { src: "/projects/gcl-control-suite.webp", width: 1600, height: 800, alt: "GCL E-Commerce admin and vendor control suite" },
    ],
    links: [{ label: "Live site", url: "https://gcl-ecom.vercel.app" }],
    agent: {
      label: "AI shopping agent · Live",
      actions: ["Places orders", "Updates addresses", "Cancels orders", "Checks order status"],
      note: "Fully working end to end, powered by a production backend deployed on a VPS.",
    },
    stackDetails: [
      {
        label: "Frontend",
        value: "Next.js 16 App Router · strict TypeScript · Tailwind v4 · shadcn-style primitives · Radix · lucide · TanStack Query · Zustand · URL search params · React Hook Form + Zod",
      },
      {
        label: "Backend",
        value: "PostgreSQL 16 · Drizzle ORM · Express 4 · Redis 7 · BullMQ · Socket.IO · NodeNext TypeScript · typed schema → controller",
      },
    ],
  },
  {
    id: "elevator-video-pitch",
    number: "02",
    title: "Elevator Video Pitch",
    type: "Video-first recruitment",
    url: "https://evpitch.com",
    description:
      "A video-first careers platform where candidates record 30-second elevator pitches and apply to jobs, while recruiters post roles, hear the person behind the resume and send one-click feedback. Companies can also share 60-second culture pitches.",
    cover: evpHomepage,
    media: [evpHomepage],
    links: [{ label: "Live site", url: "https://evpitch.com" }],
    highlights: ["30-second candidate pitches", "Recruiter pitch + feedback"],
    tech: ["Next.js", "Express", "Cloudflare R2", "HLS", "Nginx", "VPS"],
  },
  {
    id: "g-ten-bespoke",
    number: "03",
    title: "G-TEN Bespoke",
    type: "Bespoke business platform",
    url: "https://gtenbespoke.com/",
    description:
      "A responsive bespoke tailoring website paired with a full admin workspace for generating receipts and controlling bookings, expenses, galleries, content, users and day-to-day operations.",
    cover: gtenWebsite,
    media: [gtenWebsite],
    links: [{ label: "Live site", url: "https://gtenbespoke.com/" }],
    highlights: ["Receipt generator", "Full admin control"],
    tech: ["Next.js", "Express", "MongoDB", "Receipt Generator", "Admin Dashboard"],
  },
  {
    id: "prophetic-pathway",
    number: "04",
    title: "Prophetic Pathway",
    type: "Full-stack web & mobile",
    url: "https://ej-ppathway-website.vercel.app/",
    description:
      "Built the responsive web and cross-platform mobile product plus the backend systems that connect seekers with verified spiritual advisors through live video, audio and instant chat, with per-minute wallet billing, recordings and transcripts.",
    cover: pathwayWebsite,
    media: [pathwayWebsite],
    links: [
      { label: "Live site", url: "https://ej-ppathway-website.vercel.app/" },
      { label: "App Store", url: "https://apps.apple.com/us/app/prophetic-pathway/id6774471827" },
      { label: "Google Play", url: "https://play.google.com/store/apps/details?id=com.prophetic.ppathway" },
    ],
    highlights: ["Video · Audio · Chat", "Wallet + transcripts"],
    stackDetails: [
      { label: "Frontend", value: "Next.js · Flutter · Dart · TypeScript · Tailwind CSS" },
      {
        label: "Backend",
        value: "WebRTC consultation services · wallet and session state · per-minute billing · recording and transcript workflows · Cloudinary",
      },
    ],
  },
  {
    id: "diamond-auctions",
    number: "05",
    title: "Diamond Auctions",
    type: "Front-end development",
    url: "https://diamondauctionsllc.com/",
    description:
      "Built the responsive auction discovery experience for a live production marketplace, including bidder registration and guidance interfaces, multi-role account journeys and a structured seller item-submission workflow.",
    cover: diamondWebsite,
    media: [diamondWebsite],
    links: [{ label: "Live site", url: "https://diamondauctionsllc.com/" }],
    highlights: ["Auction discovery", "Structured seller intake"],
    tech: ["Next.js", "React", "Tailwind CSS", "Auction browsing UI", "Seller intake forms"],
  },
  {
    id: "walk-throughz",
    number: "06",
    title: "Walk Throughz",
    type: "Front-end development",
    url: "https://walkthroughz.com/",
    description:
      "Built the responsive location discovery experience, combining media-rich place stories, personal local insights and deal discovery with Cloudinary-powered media delivery and PayPal checkout flows.",
    cover: walkthroughzWebsite,
    media: [walkthroughzWebsite],
    links: [{ label: "Live site", url: "https://walkthroughz.com/" }],
    highlights: ["Local discovery", "PayPal checkout"],
    tech: ["Next.js", "React", "Tailwind CSS", "Cloudinary", "PayPal"],
  },
];
