import type { RequestHandler } from './$types';

const UMAMI_URL = process.env.UMAMI_URL || 'https://umami.tail824e95.ts.net';

export const POST: RequestHandler = async ({ request, fetch }) => {
	const body = await request.json();
	const res = await fetch(`${UMAMI_URL}/api/send`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'User-Agent': request.headers.get('user-agent') || '',
			'X-Forwarded-For': request.headers.get('x-forwarded-for') || ''
		},
		body: JSON.stringify(body)
	});

	return new Response(await res.text(), {
		status: res.status,
		headers: {
			'Content-Type': 'application/json'
		}
	});
};
