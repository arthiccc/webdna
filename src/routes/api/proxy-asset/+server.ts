import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const assetUrl = url.searchParams.get('url');
  
  if (!assetUrl) {
    throw error(400, 'Missing url parameter');
  }

  try {
    const response = await fetch(assetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebDNABot/1.0)'
      }
    });

    if (!response.ok) {
      throw error(response.status, `Failed to fetch asset: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    const body = await response.text();

    return new Response(body, {
      headers: {
        'Content-Type': contentType || 'text/plain',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (err: any) {
    console.error('Asset proxy error:', err);
    throw error(500, `Error fetching asset: ${err.message}`);
  }
};
