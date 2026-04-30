import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BLOCKED_HOSTS = [
	'localhost', '127.0.0.1', '0.0.0.0', '::1',
	'169.254.169.254', '10.0.0.0', '192.168.',
	'172.16.', '172.17.', '172.18.', '172.19.',
	'172.20.', '172.21.', '172.22.', '172.23.',
	'172.24.', '172.25.', '172.26.', '172.27.',
	'172.28.', '172.29.', '172.30.', '172.31.',
	'[::1]', '0177.0.0.1', '0x7f000001'
];

function isSSRF(url: string): boolean {
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;
		const host = parsed.hostname.toLowerCase();
		return BLOCKED_HOSTS.some(blocked => host === blocked || host.startsWith(blocked));
	} catch {
		return true;
	}
}

export const GET: RequestHandler = async ({ url }) => {
	const assetUrl = url.searchParams.get('url');

	if (!assetUrl) {
		throw error(400, 'Missing url parameter');
	}

	if (isSSRF(assetUrl)) {
		throw error(403, 'URL not allowed');
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
		const body = await response.arrayBuffer();

		return new Response(body, {
			headers: {
				'Content-Type': contentType || 'application/octet-stream',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch (err: any) {
		console.error('Asset proxy error:', err);
		throw error(500, `Error fetching asset: ${err.message}`);
	}
};
