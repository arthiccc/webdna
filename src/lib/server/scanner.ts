import * as cheerio from 'cheerio';
import type { SiteReport, TechStack, SocialLink, RedFlag, Subdomain, AssetNode } from '../types';
import { fetchDNS, fetchSSL, analyzeHeaders, fetchIPInfo } from './scanner/network';
import { analyzeHtml } from '../scanner/analysis';
import { env } from '$env/dynamic/private';

// Helper for fetch with timeout to prevent serverless function hangs
async function fetchWithTimeout(url: string, options: any = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export async function getNetworkOnlyReport(domain: string): Promise<Partial<SiteReport>> {
  const [dnsRecords, sslCert] = await Promise.all([
    fetchDNS(domain).catch(() => []),
    fetchSSL(domain).catch(() => undefined),
  ]);

  const firstA = dnsRecords.find(r => r.type === 'A')?.value;
  const ipInfo = firstA ? await fetchIPInfo(firstA) : { provider: 'Unknown', location: 'Unknown' };

  return {
    dns: dnsRecords,
    ssl: sslCert,
    ip: firstA,
    provider: ipInfo.provider,
    location: ipInfo.location,
    emailSecurity: {
      spf: dnsRecords.some(r => r.type === 'TXT' && r.value.includes('v=spf1')),
      dmarc: dnsRecords.some(r => r.type === 'TXT' && r.value.includes('v=DMARC1'))
    },
  };
}

export async function scanUrl(targetUrl: string): Promise<SiteReport> {
  // Ensure protocol
  if (!targetUrl.startsWith('http')) {
    targetUrl = 'https://' + targetUrl;
  }

  const headersMap = {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'X-Forwarded-For': '66.249.66.1', // Googlebot IP range hint
    'Cache-Control': 'no-cache'
  };

  let response;
  try {
    console.log(`[scanner.ts] Attempting initial fetch to ${targetUrl}`);
    response = await fetchWithTimeout(targetUrl, { headers: headersMap, redirect: 'follow' }, 8000);
    console.log(`[scanner.ts] Initial fetch completed. Status: ${response.status}`);
  } catch (err: any) {
    console.error(`[scanner.ts] Initial fetch threw an error:`, err);
    throw new Error(`Connection timed out or failed: ${err.message}`);
  }

  let html = '';
  let finalUrl = targetUrl;

  if (!response.ok) {
    console.log(`[scanner.ts] Response not ok: ${response.status} ${response.statusText}`);
    if (response.status === 403 || response.status === 503) {
      console.log(`[scanner.ts] Cloudflare/WAF block detected for ${targetUrl}. Attempting fallback via ScrapingAnt...`);
      try {
        const apiKey = env.SCRAPINGANT_API_KEY;
        if (!apiKey) {
           console.error("[scanner.ts] SCRAPINGANT_API_KEY is missing!");
           throw new Error("SCRAPINGANT_API_KEY environment variable is not set. Cannot bypass Cloudflare.");
        }
        
        // Added browser=false to make the fetch 10x faster (bypasses headless Chrome, just uses proxy network)
        const proxyUrl = `https://api.scrapingant.com/v2/general?url=${encodeURIComponent(targetUrl)}&x-api-key=${apiKey}&browser=false`;
        console.log(`[scanner.ts] Fetching from ScrapingAnt...`);
        let proxyResponse = await fetchWithTimeout(proxyUrl, {}, 15000);
        console.log(`[scanner.ts] ScrapingAnt responded with status: ${proxyResponse.status}`);
        
        let proxyText = await proxyResponse.text();

        // Handle 409 Concurrency Limit (Free tier only allows 1 request at a time)
        if (proxyResponse.status === 409) {
           console.log(`[scanner.ts] Hit ScrapingAnt concurrency limit (409). Waiting 2.5s and retrying...`);
           await new Promise(resolve => setTimeout(resolve, 2500));
           proxyResponse = await fetchWithTimeout(proxyUrl, {}, 15000);
           proxyText = await proxyResponse.text();
           console.log(`[scanner.ts] ScrapingAnt retry status: ${proxyResponse.status}`);
        }
        
        if (!proxyResponse.ok) {
           console.error(`[scanner.ts] ScrapingAnt API error response:`, proxyText);
           throw new Error(`ScrapingAnt API failed: ${proxyResponse.status} ${proxyText}`);
        }
        
        html = proxyText;
        if (!html) throw new Error("Empty response from ScrapingAnt");
      } catch (proxyErr: any) {
        console.error(`[scanner.ts] ScrapingAnt fallback failed:`, proxyErr);
        throw new Error(`The target website blocked our crawler, and the ScrapingAnt fallback failed. (${proxyErr.message})`);
      }
    } else {
      throw new Error(`Site returned ${response.status}: ${response.statusText}`);
    }
  } else {
    html = await response.text();
    finalUrl = response.url;
  }

  console.log(`[scanner.ts] HTML fetched successfully. Length: ${html.length}`);
  let $ = cheerio.load(html);

  // Detect Meta Refresh redirect
  const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
  if (metaRefresh) {
    const match = metaRefresh.match(/url=(.+)$/i);
    if (match && match[1]) {
      const redirectUrl = new URL(match[1].trim(), finalUrl).href;
      try {
        response = await fetchWithTimeout(redirectUrl, { headers: headersMap, redirect: 'follow' }, 5000);
        if (response.ok) {
          finalUrl = response.url;
          html = await response.text();
          $ = cheerio.load(html);
        }
      } catch (err) {
        console.error('Meta refresh fetch failed:', err);
      }
    }
  }

  const urlObj = new URL(finalUrl);
  const domain = urlObj.hostname;

  // Run network checks concurrently
  const [dnsRecords, sslCert, securityHeaders] = await Promise.all([
    fetchDNS(domain).catch(() => []),
    fetchSSL(domain).catch(() => undefined),
    analyzeHeaders(response.headers)
  ]);

  // Resolve IP Info from the first A record
  const firstA = dnsRecords.find(r => r.type === 'A')?.value;
  const ipInfo = firstA ? await fetchIPInfo(firstA) : { provider: 'Unknown', location: 'Unknown' };

  // 1. Basic Info
  const title = $('title').text() || $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content') || '';
  const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
  
  // Advanced Favicon Detection
  const faviconAttr = 
    $('link[rel="apple-touch-icon"]').attr('href') ||
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    $('link[rel*="icon"]').attr('href');
    
  let favicon = faviconAttr ? new URL(faviconAttr, finalUrl).href : `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  
  // 2. Logo Detection
  const ogImage = $('meta[property="og:image"]').attr('content');
  let logo = ogImage || $('meta[property="og:logo"]').attr('content') || $('img[src*="logo"]').first().attr('src');
  if (logo) logo = new URL(logo, finalUrl).href;
  else logo = favicon;

  // 3. Brand Colors
  const brandColors: string[] = [];
  const themeColor = $('meta[name="theme-color"]').attr('content');
  if (themeColor) brandColors.push(themeColor);
  
  const hexMatch = html.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g);
  if (hexMatch) {
    const uniqueHex = Array.from(new Set(hexMatch))
      .filter(c => {
        const lower = c.toLowerCase();
        return !['#ffffff', '#000000', '#fff', '#000', '#f3f4f6', '#111827', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f9fafb'].includes(lower);
      })
      .slice(0, 4);
    brandColors.push(...uniqueHex);
  }
  const finalColors = Array.from(new Set(brandColors)).slice(0, 5);

  // 4. Tech Stack Detection
  const techStack: TechStack[] = [];
  const bodyText = $('body').html() || '';
  const headText = $('head').html() || '';
  const scripts = $('script').map((_, el) => $(el).attr('src')).get().join(' ');

  const techRules = [
    // Cloud & Infrastructure
    { name: 'Firebase', category: 'PaaS', pattern: /firebase|gstatic\.com\/firebasejs/, website: 'https://firebase.google.com' },
    { name: 'Amazon S3', category: 'Storage', pattern: /s3\.amazonaws\.com|s3-/, website: 'https://aws.amazon.com/s3' },
    { name: 'Amazon CloudFront', category: 'CDN', pattern: /cloudfront\.net/, website: 'https://aws.amazon.com/cloudfront' },
    { name: 'Azure Edge', category: 'CDN', pattern: /azureedge\.net|windows\.net/, website: 'https://azure.microsoft.com' },
    { name: 'Cloudflare', category: 'Infrastructure', pattern: /cloudflare|_cf_container/, website: 'https://cloudflare.com' },
    { name: 'Vercel', category: 'Hosting', pattern: /vercel\.app|__vercel/, website: 'https://vercel.com' },
    { name: 'Netlify', category: 'Hosting', pattern: /netlify/, website: 'https://netlify.com' },
    { name: 'Genially', category: 'LMS', pattern: /genial\.ly/, website: 'https://genial.ly' },
    
    // Frameworks & Libraries
    { name: 'Next.js', category: 'Framework', pattern: /__NEXT_DATA__|static\/chunks|next\/image/, website: 'https://nextjs.org' },
    { name: 'React', category: 'Library', pattern: /react-dom|react\.development|react-root/, website: 'https://react.dev' },
    { name: 'Svelte', category: 'Framework', pattern: /svelte-|__svelte/, website: 'https://svelte.dev' },
    { name: 'Vue.js', category: 'Framework', pattern: /v-if|data-v-|__vue__/, website: 'https://vuejs.org' },
    { name: 'Nuxt.js', category: 'Framework', pattern: /__NUXT__/, website: 'https://nuxt.com' },
    { name: 'Astro', category: 'Framework', pattern: /astro-/, website: 'https://astro.build' },
    { name: 'Angular', category: 'Framework', pattern: /ng-version|ng-root/, website: 'https://angular.io' },
    { name: 'jQuery', category: 'Library', pattern: /jquery\.min\.js|jquery-/, website: 'https://jquery.com' },
    
    // UI & Styling
    { name: 'Tailwind CSS', category: 'Styling', pattern: /tailwind\.config|tw-|text-neutral/, website: 'https://tailwindcss.com' },
    { name: 'Bootstrap', category: 'Styling', pattern: /bootstrap\.min\.css|bootstrap-/, website: 'https://getbootstrap.com' },
    { name: 'Framer Motion', category: 'Animation', pattern: /framer-motion/, website: 'https://framer.com/motion' },
    { name: 'GSAP', category: 'Animation', pattern: /gsap|ScrollTrigger/, website: 'https://greensock.com/gsap' },
    { name: 'Three.js', category: 'Graphics', pattern: /three\.js|THREE\./, website: 'https://threejs.org' },
    
    // Analytics & Marketing
    { name: 'Google Analytics', category: 'Analytics', pattern: /googletagmanager\.com|google-analytics\.com|UA-[0-9]+-[0-9]+/, website: 'https://analytics.google.com' },
    { name: 'Umami', category: 'Analytics', pattern: /umami\.js|data-website-id/, website: 'https://umami.is' },
    { name: 'Mixpanel', category: 'Analytics', pattern: /mixpanel\.com/, website: 'https://mixpanel.com' },
    { name: 'Hotjar', category: 'Analytics', pattern: /static\.hotjar\.com/, website: 'https://hotjar.com' },
    
    // CMS & E-commerce
    { name: 'WordPress', category: 'CMS', pattern: /wp-content|wp-includes|WordPress/, website: 'https://wordpress.org' },
    { name: 'Shopify', category: 'E-commerce', pattern: /shopify\.com|cdn\.shopify\.com/, website: 'https://shopify.com' },
    { name: 'Webflow', category: 'CMS', pattern: /webflow\.com|w-custom-css/, website: 'https://webflow.com' },
    { name: 'Magento', category: 'E-commerce', pattern: /magento/i, website: 'https://adobe.com/commerce' },
    
    // Servers & Backend
    { name: 'Nginx', category: 'Web Server', pattern: /nginx/i, header: 'Server' },
    { name: 'Apache', category: 'Web Server', pattern: /apache/i, header: 'Server' },
    { name: 'TypeScript', category: 'Language', pattern: /\.ts|typescript/i, header: 'X-Powered-By' },
    { name: 'PHP', category: 'Language', pattern: /php/i, header: 'X-Powered-By' },
    { name: 'Node.js', category: 'Runtime', pattern: /node\.js|express/i, header: 'X-Powered-By' },
    
    // Payments & Services
    { name: 'Stripe', category: 'Payments', pattern: /js\.stripe\.com/, website: 'https://stripe.com' },
    { name: 'Intercom', category: 'Support', pattern: /intercom\.io/, website: 'https://intercom.com' },
    { name: 'Sentry', category: 'Monitoring', pattern: /sentry\.io/, website: 'https://sentry.io' }
  ];

  const serverHeader = response.headers.get('Server') || '';
  const poweredByHeader = response.headers.get('X-Powered-By') || '';

  for (const rule of techRules) {
    let detected = false;
    if (rule.pattern.test(headText) || rule.pattern.test(bodyText) || rule.pattern.test(scripts) || rule.pattern.test(html)) {
      detected = true;
    } else if (rule.header === 'Server' && rule.pattern.test(serverHeader)) {
      detected = true;
    } else if (rule.header === 'X-Powered-By' && rule.pattern.test(poweredByHeader)) {
      detected = true;
    }

    if (detected) {
      techStack.push({ 
        name: rule.name, 
        category: rule.category, 
        website: rule.website || `https://www.google.com/search?q=${encodeURIComponent(rule.name)}`
      });
    }
  }

  // 5. Social Links
  const socialLinks: SocialLink[] = [];
  const socialPatterns = [
    { platform: 'Twitter', pattern: /twitter\.com\/([\w]+)/ },
    { platform: 'GitHub', pattern: /github\.com\/([\w]+)/ },
    { platform: 'LinkedIn', pattern: /linkedin\.com\/company\/([\w-]+)/ },
    { platform: 'Instagram', pattern: /instagram\.com\/([\w]+)/ }
  ];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    for (const sp of socialPatterns) {
      if (sp.pattern.test(href) && !socialLinks.find(l => l.platform === sp.platform)) {
        socialLinks.push({ platform: sp.platform, url: href });
      }
    }
  });

  // 6. Fonts
  const fonts: string[] = [];
  const fontLinks = $('link[href*="fonts.googleapis.com"]').attr('href');
  if (fontLinks) {
    const fontNames = fontLinks.match(/family=([\w\+]+)/g);
    if (fontNames) {
      fonts.push(...fontNames.map(f => f.replace('family=', '').replace(/\+/g, ' ')));
    }
  }
  if (fonts.length === 0) fonts.push('Inter', 'System Sans');

  // 7. Performance, Accessibility & SEO Audit
  const pageSize = Math.round(new TextEncoder().encode(html).length / 1024);
  const domNodes = $('*').length;
  const compression = response.headers.get('content-encoding') || 'None';
  
  // Accessibility Checks
  const totalImgs = $('img').length;
  const missingAlt = $('img:not([alt])').length + $('img[alt=""]').length;
  const hasLang = $('html[lang]').length > 0;
  const hasMain = $('main').length > 0;
  const h1Count = $('h1').length;
  const hasH1 = h1Count === 1;
  const landmarks = $('header, nav, footer, main, aside').length;
  
  // 8. Red Flags Audit
  const redFlags: RedFlag[] = [];
  const mixedContent = $('img[src^="http://"], script[src^="http://"], link[href^="http://"]').length;
  if (mixedContent > 0 && finalUrl.startsWith('https')) {
    redFlags.push({ type: 'security', message: `Found ${mixedContent} insecure (HTTP) assets on HTTPS page.` });
  }
  
  if (!hasLang) redFlags.push({ type: 'info', message: 'HTML lang attribute is missing.' });

  // 9. Subdomain Discovery (via Link Analysis)
  const baseDomain = domain.replace(/^www\./, '');
  const foundSubdomains = new Set<string>();
  
  $('[href], [src]').each((_, el) => {
    const attr = $(el).attr('href') || $(el).attr('src');
    if (attr && attr.includes(baseDomain)) {
      try {
        const url = new URL(attr, finalUrl);
        const sub = url.hostname.split(`.${baseDomain}`)[0];
        if (sub && sub !== url.hostname && sub !== 'www') {
          foundSubdomains.add(sub);
        }
      } catch { /* ignore invalid urls */ }
    }
  });

  const subdomains: Subdomain[] = Array.from(foundSubdomains).map(sub => ({
    name: sub,
    url: `https://${sub}.${baseDomain}`,
    status: 'active'
  }));
  
  if (domain.startsWith('www.')) {
    subdomains.unshift({ name: 'www', url: `https://${domain}`, status: 'active' });
  }

  // Scoring logic (closer to Lighthouse)
  let a11yScore = 100;
  if (!hasLang) a11yScore -= 10;
  if (!hasMain) a11yScore -= 5;
  if (h1Count === 0) a11yScore -= 10;
  if (h1Count > 1) a11yScore -= 5;
  if (totalImgs > 0) a11yScore -= (missingAlt / totalImgs) * 30;
  if (landmarks < 3) a11yScore -= 10;
  
  const finalA11yScore = Math.max(0, Math.min(100, Math.round(a11yScore)));

  const cleanName = domain.replace(/^www\./, '').split('.')[0];
  const siteName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  return {
    name: siteName,
    domain,
    favicon,
    logo,
    brandColors: finalColors.length > 0 ? finalColors : ['#000000', '#ffffff'],
    fonts: Array.from(new Set(fonts)).slice(0, 5),
    title,
    description,
    ogImage,
    techStack,
    socialLinks,
    dns: dnsRecords,
    subdomains,
    redFlags,
    ip: firstA,
    provider: ipInfo.provider,
    location: ipInfo.location,
    ssl: sslCert,
    security: securityHeaders,
    securityScore: calculateSecurityScore(sslCert, securityHeaders, mixedContent, dnsRecords),
    emailSecurity: {
      spf: dnsRecords.some(r => r.type === 'TXT' && r.value.includes('v=spf1')),
      dmarc: dnsRecords.some(r => r.type === 'TXT' && r.value.includes('v=DMARC1'))
    },
    crawling: await discoverCrawling(domain, finalUrl),
    performance: {
      pageSize,
      domNodes,
      compression
    },
    accessibility: {
      score: finalA11yScore,
      missingAltTags: missingAlt,
      hasAriaLabels: $('[aria-label], [role]').length > 0
    },
    assets: buildAssetTree($, finalUrl),
    updatedAt: new Date().toISOString()
  };
}

function buildAssetTree($: cheerio.CheerioAPI, baseUrl: string): any[] {
  const assets: { url: string, type: any }[] = [];
  const domain = new URL(baseUrl).hostname;

  $('[src], link[rel="stylesheet"], link[rel*="icon"]').each((_, el) => {
    const urlAttr = $(el).attr('src') || $(el).attr('href');
    if (!urlAttr) return;

    try {
      const fullUrl = new URL(urlAttr, baseUrl).href;
      const isInternal = fullUrl.includes(domain);

      let type: 'image' | 'script' | 'style' | 'document' = 'document';
      if (urlAttr.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)/i)) type = 'image';
      else if (urlAttr.match(/\.js/i)) type = 'script';
      else if (urlAttr.match(/\.css/i)) type = 'style';

      if (!assets.find(a => a.url === fullUrl)) {
        assets.push({ url: fullUrl, type });
      }
    } catch { /* ignore */ }
  });

  const root: any[] = [];
  
  assets.forEach(asset => {
    const urlObj = new URL(asset.url);
    const parts = urlObj.pathname.split('/').filter(p => p);
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      let existing = currentLevel.find(n => n.name === part);

      if (!existing) {
        existing = {
          name: part,
          type: isLast ? 'file' : 'folder',
          url: isLast ? asset.url : undefined,
          fileType: isLast ? asset.type : undefined,
          children: isLast ? undefined : []
        };
        currentLevel.push(existing);
      }
      if (!isLast) {
        if (!existing.children) {
          existing.children = [];
          existing.type = 'folder';
        }
        currentLevel = existing.children;
      }
    });
  });

  return root;
}

function calculateSecurityScore(ssl: any, headers: any[], mixedContent: number, dns: any[]): string {
  let score = 100;
  
  if (!ssl || ssl.isExpired) score -= 40;
  if (mixedContent > 0) score -= 20;
  
  const hsts = headers.find(h => h.name === 'Strict-Transport-Security' && h.status === 'secure');
  const csp = headers.find(h => h.name === 'Content-Security-Policy' && h.status === 'secure');
  
  if (!hsts) score -= 15;
  if (!csp) score -= 15;
  
  const hasSpf = dns.some(r => r.type === 'TXT' && r.value.includes('v=spf1'));
  if (!hasSpf) score -= 5;

  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

async function discoverCrawling(domain: string, baseUrl: string): Promise<{ sitemap?: string, robots?: string }> {
  const results: { sitemap?: string, robots?: string } = {};
  
  try {
    const robotsUrl = `https://${domain}/robots.txt`;
    const res = await fetchWithTimeout(robotsUrl, {}, 3000);
    if (res.ok) {
      results.robots = robotsUrl;
      const text = await res.text();
      const sitemapMatch = text.match(/Sitemap:\s*(.+)/i);
      if (sitemapMatch) results.sitemap = sitemapMatch[1].trim();
    }
    
    if (!results.sitemap) {
      const sitemapUrl = `https://${domain}/sitemap.xml`;
      const sRes = await fetchWithTimeout(sitemapUrl, {}, 3000);
      if (sRes.ok) results.sitemap = sitemapUrl;
    }
  } catch { /* ignore */ }
  
  return results;
}
