import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch, getClientAddress }) => {
	const body = await request.json();
	const clientIp = getClientAddress();

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'User-Agent': request.headers.get('user-agent') || '',
		'Referer': request.headers.get('referer') || '',
		'X-Forwarded-For': clientIp,
		'X-Real-IP': clientIp
	};

	// Forward Cloudflare headers if they exist to help Umami with geolocation
	const cfHeaders = ['cf-connecting-ip', 'cf-ipcountry', 'cf-region', 'cf-city'];
	for (const header of cfHeaders) {
		const value = request.headers.get(header);
		if (value) headers[header] = value;
	}

	const res = await fetch('https://umami.tail824e95.ts.net/api/send', {
		method: 'POST',
		headers,
		body: JSON.stringify(body)
	});

	return new Response(await res.text(), {
		status: res.status,
		headers: {
			'Content-Type': 'application/json'
		}
	});
};
