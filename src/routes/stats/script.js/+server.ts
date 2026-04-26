import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch }) => {
	const res = await fetch('https://umami.tail824e95.ts.net/script.js');
	const script = await res.text();
	
	return new Response(script, {
		headers: {
			'Content-Type': 'application/javascript',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
