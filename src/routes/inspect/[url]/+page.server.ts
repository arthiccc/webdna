import type { PageServerLoad } from './$types';
import { scanUrl } from '$lib/server/scanner';

export const load: PageServerLoad = async ({ params }) => {
  const url = decodeURIComponent(params.url);
  
  return {
    report: scanUrl(url).catch(err => {
      console.error('Scan error:', err);
      throw err;
    }),
    url
  };
};
