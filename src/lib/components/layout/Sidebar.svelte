<script lang="ts">
	import { cn } from '$lib/utils';
	import { page } from '$app/state';
	import {
		Search,
		Globe,
		SwatchBook,
		ShieldCheck,
		Gauge,
		History,
		Star,
		Dna,
		Users
	} from '@lucide/svelte';

	let { class: className } = $props<{ class?: string }>();

	import { history } from '$lib/stores/appState';

	const links = [
		{ name: 'Inspect', icon: Search, href: '/' },
		{ name: 'Favorites', icon: Star, href: '/favorites' },
		{ name: 'History', icon: History, href: '/history' },
		{ name: 'About Us', icon: Users, href: '/about' }
	];

	const categories = [
		{ name: 'Branding', icon: SwatchBook, href: '/directory?category=Branding' },
		{ name: 'Security', icon: ShieldCheck, href: '/directory?category=Security' },
		{ name: 'Performance', icon: Gauge, href: '/directory?category=Performance' }
	];
</script>

<aside
	class={cn(
		'md:fixed md:top-0 md:left-0 md:h-screen',
		'z-50 hidden w-56 flex-col space-y-4 md:flex',
		'bg-[var(--whois-sidebar)] px-3 py-6',
		className
	)}
>
	<div class="mb-6 flex items-center px-4">
		<h2 class="text-xs font-black tracking-[0.25em] text-[var(--whois-accent)] uppercase">
			WebDNA
		</h2>
	</div>

	<nav class="flex flex-col space-y-1">
		{#each links as link}
			<a
				href={link.href}
				class={cn(
					'flex items-center space-x-3 border border-transparent px-3 py-2 text-[10px] font-bold tracking-widest uppercase transition-all',
					page.url.pathname === link.href
						? 'border-[var(--whois-border)] bg-[var(--whois-accent-dim)] text-[var(--whois-accent)]'
						: 'text-[var(--whois-text-muted)] hover:bg-[var(--whois-surface)] hover:text-[var(--whois-text)]'
				)}
			>
				<link.icon size={14} strokeWidth={2} />
				<span>{link.name}</span>
			</a>
		{/each}
	</nav>

	{#if $history.length > 0}
		<div class="mt-8">
			<div class="mx-3 mb-6 h-px bg-[var(--whois-border)]"></div>
			<h3
				class="mb-4 px-3 text-[10px] font-black tracking-[0.2em] text-[var(--whois-text-muted)] uppercase"
			>
				Recents
			</h3>
			<div class="flex flex-col space-y-1">
				{#each $history.slice(0, 12) as item}
					<a
						href="/inspect/{encodeURIComponent(item.domain)}"
						class="flex items-center space-x-3 border border-transparent px-3 py-2.5 text-[11px] font-bold tracking-widest text-[var(--whois-text-muted)] uppercase transition-all hover:bg-[var(--whois-surface)] hover:text-[var(--whois-accent)]"
					>
						<div
							class="h-4 w-4 shrink-0 border border-[var(--whois-border)] bg-[var(--whois-surface)] p-[2px]"
						>
							<img
								src={item.favicon}
								alt=""
								class="h-full w-full object-contain"
								onerror={(e) => {
									const target = e.currentTarget;
									if (!target.src.includes('google.com')) {
										target.src = `https://www.google.com/s2/favicons?domain=${item.domain}&sz=64`;
									}
								}}
							/>
						</div>
						<span class="truncate">{item.name.replace(/_/g, ' ')}</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</aside>
