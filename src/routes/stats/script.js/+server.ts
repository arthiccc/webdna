import type { RequestHandler } from './$types';

const UMAMI_URL = process.env.UMAMI_URL || 'https://umami.tail824e95.ts.net';

export const GET: RequestHandler = async ({ fetch }) => {
	const res = await fetch(`${UMAMI_URL}/script.js`);
	const script = await res.text();
	
	return new Response(script, {
		headers: {
			'Content-Type': 'application/javascript',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
