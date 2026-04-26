import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ request }) => {
  const userAgent = request.headers.get('user-agent') || '';
  const botPatterns = /bot|crawler|spider|crawling|googlebot|bingbot|yandex|baidu|duckduckbot|slurp|twitterbot|facebookexternalhit|linkedinbot|embedly|quora|lighthouse|ahrefs|semrush|dotbot/i;
  
  const isBot = botPatterns.test(userAgent);
  
  return {
    isBot
  };
};
