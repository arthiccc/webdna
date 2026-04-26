export interface TechRule {
  name: string;
  category: string;
  pattern: RegExp;
  website?: string;
  header?: string;
}

export const techRules: TechRule[] = [
  // Cloud & Infrastructure
  { name: 'Firebase', category: 'PaaS', pattern: /firebase|gstatic\.com\/firebasejs/, website: 'https://firebase.google.com' },
  { name: 'Amazon S3', category: 'Storage', pattern: /s3\.amazonaws\.com|s3-/, website: 'https://aws.amazon.com/s3' },
  { name: 'Amazon CloudFront', category: 'CDN', pattern: /cloudfront\.net/, website: 'https://aws.amazon.com/cloudfront' },
  { name: 'Azure Edge', category: 'CDN', pattern: /azureedge\.net|windows\.net/, website: 'https://azure.microsoft.com' },
  { name: 'Cloudflare', category: 'Infrastructure', pattern: /cloudflare|_cf_container/, website: 'https://cloudflare.com' },
  { name: 'Vercel', category: 'Hosting', pattern: /vercel\.app|__vercel/, website: 'https://vercel.com' },
  { name: 'Netlify', category: 'Hosting', pattern: /netlify/, website: 'https://netlify.com' },
  { name: 'Genially', category: 'LMS', pattern: /genial\.ly/, website: 'https://genial.ly' },
  
  // Frameworks & Libraries
  { name: 'Next.js', category: 'Framework', pattern: /__NEXT_DATA__|static\/chunks|next\/image/, website: 'https://nextjs.org' },
  { name: 'React', category: 'Library', pattern: /react-dom|react\.development|react-root/, website: 'https://react.dev' },
  { name: 'Svelte', category: 'Framework', pattern: /svelte-|__svelte/, website: 'https://svelte.dev' },
  { name: 'Vue.js', category: 'Framework', pattern: /v-if|data-v-|__vue__/, website: 'https://vuejs.org' },
  { name: 'Nuxt.js', category: 'Framework', pattern: /__NUXT__/, website: 'https://nuxt.com' },
  { name: 'Astro', category: 'Framework', pattern: /astro-/, website: 'https://astro.build' },
  { name: 'Angular', category: 'Framework', pattern: /ng-version|ng-root/, website: 'https://angular.io' },
  { name: 'jQuery', category: 'Library', pattern: /jquery\.min\.js|jquery-/, website: 'https://jquery.com' },
  
  // UI & Styling
  { name: 'Tailwind CSS', category: 'Styling', pattern: /tailwind\.config|tw-|text-neutral/, website: 'https://tailwindcss.com' },
  { name: 'Bootstrap', category: 'Styling', pattern: /bootstrap\.min\.css|bootstrap-/, website: 'https://getbootstrap.com' },
  { name: 'Framer Motion', category: 'Animation', pattern: /framer-motion/, website: 'https://framer.com/motion' },
  { name: 'GSAP', category: 'Animation', pattern: /gsap|ScrollTrigger/, website: 'https://greensock.com/gsap' },
  { name: 'Three.js', category: 'Graphics', pattern: /three\.js|THREE\./, website: 'https://threejs.org' },
  
  // Analytics & Marketing
  { name: 'Google Analytics', category: 'Analytics', pattern: /googletagmanager\.com|google-analytics\.com|UA-[0-9]+-[0-9]+/, website: 'https://analytics.google.com' },
  { name: 'Umami', category: 'Analytics', pattern: /umami\.js|data-website-id/, website: 'https://umami.is' },
  { name: 'Mixpanel', category: 'Analytics', pattern: /mixpanel\.com/, website: 'https://mixpanel.com' },
  { name: 'Hotjar', category: 'Analytics', pattern: /static\.hotjar\.com/, website: 'https://hotjar.com' },
  
  // CMS & E-commerce
  { name: 'WordPress', category: 'CMS', pattern: /wp-content|wp-includes|WordPress/, website: 'https://wordpress.org' },
  { name: 'Shopify', category: 'E-commerce', pattern: /shopify\.com|cdn\.shopify\.com/, website: 'https://shopify.com' },
  { name: 'Webflow', category: 'CMS', pattern: /webflow\.com|w-custom-css/, website: 'https://webflow.com' },
  { name: 'Magento', category: 'E-commerce', pattern: /magento/i, website: 'https://adobe.com/commerce' },
  
  // Servers & Backend
  { name: 'Nginx', category: 'Web Server', pattern: /nginx/i, header: 'Server' },
  { name: 'Apache', category: 'Web Server', pattern: /apache/i, header: 'Server' },
  { name: 'TypeScript', category: 'Language', pattern: /\.ts|typescript/i, header: 'X-Powered-By' },
  { name: 'PHP', category: 'Language', pattern: /php/i, header: 'X-Powered-By' },
  { name: 'Node.js', category: 'Runtime', pattern: /node\.js|express/i, header: 'X-Powered-By' },
  
  // Payments & Services
  { name: 'Stripe', category: 'Payments', pattern: /js\.stripe\.com/, website: 'https://stripe.com' },
  { name: 'Intercom', category: 'Support', pattern: /intercom\.io/, website: 'https://intercom.com' },
  { name: 'Sentry', category: 'Monitoring', pattern: /sentry\.io/, website: 'https://sentry.io' }
];

export const socialPatterns = [
  { platform: 'Twitter', pattern: /twitter\.com\/([\w]+)/ },
  { platform: 'GitHub', pattern: /github\.com\/([\w]+)/ },
  { platform: 'LinkedIn', pattern: /linkedin\.com\/company\/([\w-]+)/ },
  { platform: 'Instagram', pattern: /instagram\.com\/([\w]+)/ }
];
