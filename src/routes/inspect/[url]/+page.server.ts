import type { PageServerLoad } from './$types';
import { scanUrl, getNetworkOnlyReport } from '$lib/server/scanner';

export const load: PageServerLoad = async ({ params }) => {
  const url = decodeURIComponent(params.url);
  let domain = '';
  try {
    domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
  } catch {
    domain = url;
  }
  
  try {
    console.log(`[page.server.ts] Starting scan for URL: ${url}`);
    const report = await scanUrl(url);
    console.log(`[page.server.ts] Scan successful for URL: ${url}`);
    return {
      report,
      url,
      error: null
    };
  } catch (err: any) {
    console.error('[page.server.ts] Server scan failed. ERROR OBJECT:', err);
    console.error('[page.server.ts] ERROR MESSAGE:', err.message);
    console.error('[page.server.ts] ERROR STACK:', err.stack);
    
    // If it's a 403, we can still provide network info and let the client try
    if (err.message && (err.message.includes('403') || err.message.includes('Forbidden'))) {
      try {
        console.log(`[page.server.ts] 403 detected, falling back to network-only scan for ${domain}`);
        const networkData = await getNetworkOnlyReport(domain);
        return {
          report: null,
          networkData,
          needsClientFetch: true,
          url,
          error: null
        };
      } catch (networkErr) {
        console.error('[page.server.ts] Network-only scan failed:', networkErr);
      }
    }

    return {
      report: null,
      url,
      error: err.message || 'An unexpected error occurred during the scan.'
    };
  }
};
