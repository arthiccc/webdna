import type { SiteReport, TechStack, SocialLink, RedFlag, Subdomain, AssetNode } from '../types';
import { techRules, socialPatterns } from './rules';

export function analyzeHtml(html: string, finalUrl: string, domain: string): Partial<SiteReport> {
  // We use a regex-based approach here so it works without a full DOM if needed,
  // but in the browser we can use DOMParser.
  // For maximum compatibility across server (cheerio) and client, 
  // we'll pass in an object that implements a basic query selector.

  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : '';

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i) || 
                   html.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1] : '';

  // Tech Stack
  const techStack: TechStack[] = [];
  for (const rule of techRules) {
    if (rule.pattern.test(html)) {
      techStack.push({ 
        name: rule.name, 
        category: rule.category, 
        website: rule.website || `https://www.google.com/search?q=${encodeURIComponent(rule.name)}`
      });
    }
  }

  // Social Links
  const socialLinks: SocialLink[] = [];
  for (const sp of socialPatterns) {
    const match = html.match(new RegExp(`href=["']([^"']?${sp.pattern.source}[^"']?)["']`, 'i'));
    if (match && !socialLinks.find(l => l.platform === sp.platform)) {
      socialLinks.push({ platform: sp.platform, url: match[1] });
    }
  }

  // Colors
  const brandColors: string[] = [];
  const hexMatch = html.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g);
  if (hexMatch) {
    const uniqueHex = Array.from(new Set(hexMatch))
      .filter(c => {
        const lower = c.toLowerCase();
        return !['#ffffff', '#000000', '#fff', '#000', '#f3f4f6', '#111827', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f9fafb'].includes(lower);
      })
      .slice(0, 5);
    brandColors.push(...uniqueHex);
  }

  return {
    title,
    description,
    techStack,
    socialLinks,
    brandColors: brandColors.length > 0 ? brandColors : ['#000000', '#ffffff'],
  };
}
