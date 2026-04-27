import type { PageServerLoad } from './$types';
import { scanUrl, getNetworkOnlyReport } from '$lib/server/scanner';

export const load: PageServerLoad = ({ params }) => {
  const url = decodeURIComponent(params.url);

  // Basic URL validation to prevent 500 errors on typos like "fmhy..net"
  let domain = url;
  try {
    const tempUrl = url.startsWith('http') ? url : `https://${url}`;
    const urlObj = new URL(tempUrl);
    domain = urlObj.hostname;
    // Check for double dots or other common typos in the domain
    if (domain.includes('..') || !domain.includes('.')) {
      throw new Error("Invalid domain name format.");
    }
  } catch (e) {
    return {
      streamed: {
        report: Promise.reject(new Error(`"${url}" is not a valid website URL. Please check for typos like double dots.`))
      },
      url
    };
  }

  // We don't await the scan here. We return a promise so SvelteKit streams it.
  const fetchReport = async () => {
    try {
      console.log(`[page.server.ts] Starting background scan for URL: ${url}`);
      const report = await scanUrl(url);
      console.log(`[page.server.ts] Background scan successful for URL: ${url}`);
      return report;
    } catch (err: any) {
      console.error('[page.server.ts] Background scan failed:', err.message);

      // If it's a 403, try to provide network info as fallback
      if (err.message && (err.message.includes('403') || err.message.includes('Forbidden'))) {
        try {
          let domain = url;
          try { domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname; } catch { }
          const networkData = await getNetworkOnlyReport(domain);
          return {
            networkData,
            needsClientFetch: true,
            error: null
          };
        } catch (networkErr) {
          console.error('[page.server.ts] Network-only fallback failed:', networkErr);
        }
      }

      throw err;
    }
  };

  return {
    streamed: {
      report: fetchReport()
    },
    url
  };
};
