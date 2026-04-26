export interface TechStack {
  name: string;
  category: string;
  website?: string;
  icon?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface DNSRecord {
  type: string;
  value: string;
}

export interface SSLCertificate {
  issuer: string;
  validFrom: string;
  validTo: string;
  protocol: string;
  subject: string;
  isExpired: boolean;
  sans: string[];
}

export interface SecurityHeader {
  name: string;
  value: string;
  status: 'secure' | 'warning' | 'missing';
}

export interface PerformanceMetrics {
  pageSize: number; // in KB
  domNodes: number;
  compression?: string;
  loadTime?: number;
}

export interface AccessibilityMetrics {
  score: number;
  missingAltTags: number;
  hasAriaLabels: boolean;
}

export interface Subdomain {
  name: string;
  url: string;
  status: 'active' | 'unknown';
}

export interface RedFlag {
  type: 'security' | 'warning' | 'info';
  message: string;
}

export interface AssetNode {
  name: string;
  type: 'file' | 'folder';
  url?: string;
  children?: AssetNode[];
  fileType?: 'image' | 'script' | 'style' | 'document';
}

export interface SiteReport {
  name: string;
  domain: string;
  favicon: string;
  logo?: string;
  brandColors: string[];
  fonts: string[];
  title: string;
  description: string;
  ogImage?: string;
  techStack: TechStack[];
  socialLinks: SocialLink[];
  dns: DNSRecord[];
  subdomains: Subdomain[];
  redFlags: RedFlag[];
  ip?: string;
  provider?: string;
  location?: string;
  ssl?: SSLCertificate;
  security: SecurityHeader[];
  securityScore: string;
  emailSecurity: {
    spf: boolean;
    dmarc: boolean;
  };
  crawling: {
    sitemap?: string;
    robots?: string;
  };
  performance?: PerformanceMetrics;
  accessibility?: AccessibilityMetrics;
  assets?: AssetNode[];
  language?: string;
  themeColor?: string;
  headings?: {
    h1: number;
    h2: number;
    h3: number;
  };
  updatedAt: string;
}

export const mockReports: Record<string, SiteReport> = {
  "linear.app": {
    name: "Linear",
    domain: "linear.app",
    favicon: "https://linear.app/static/favicon.ico",
    logo: "https://linear.app/static/images/logo.png",
    brandColors: ["#5E6AD2", "#000000", "#FFFFFF"],
    fonts: ["Inter", "Geist"],
    title: "Linear – The issue tracking tool you'll enjoy using",
    description: "Linear helps streamline software projects, sprints, tasks, and bug tracking. It's built for high-performance teams.",
    ogImage: "https://linear.app/static/images/og-image.png",
    techStack: [
      { name: "Next.js", category: "Framework" },
      { name: "React", category: "Library" },
      { name: "Tailwind CSS", category: "Styling" },
      { name: "Vercel", category: "Hosting" }
    ],
    socialLinks: [
      { platform: "Twitter", url: "https://twitter.com/linear" },
      { platform: "GitHub", url: "https://github.com/linear" }
    ],
    dns: [],
    subdomains: [],
    redFlags: [],
    security: [],
    emailSecurity: { spf: true, dmarc: true },
    crawling: {},
    updatedAt: new Date().toISOString()
  },
  "stripe.com": {
    name: "Stripe",
    domain: "stripe.com",
    favicon: "https://stripe.com/favicon.ico",
    brandColors: ["#635BFF", "#0A2540", "#FFFFFF"],
    fonts: ["Sohne", "Roboto"],
    title: "Stripe | Payment infrastructure for the internet",
    description: "Million of companies of all sizes use Stripe online and in person to accept payments, send payouts, and manage their businesses online.",
    techStack: [
      { name: "Ruby on Rails", category: "Framework" },
      { name: "React", category: "Library" },
      { name: "AWS", category: "Hosting" }
    ],
    socialLinks: [
      { platform: "Twitter", url: "https://twitter.com/stripe" },
      { platform: "LinkedIn", url: "https://linkedin.com/company/stripe" }
    ],
    dns: [],
    subdomains: [],
    redFlags: [],
    security: [],
    emailSecurity: { spf: true, dmarc: true },
    crawling: {},
    updatedAt: new Date().toISOString()
  }
};
