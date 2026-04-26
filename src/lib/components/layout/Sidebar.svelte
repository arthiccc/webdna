<script lang="ts">
	import { cn } from '$lib/utils';
	import { page } from '$app/state';
	import { Separator } from '$lib/components/ui/separator';
	import { Search, Globe, SwatchBook, ShieldCheck, Gauge, History, Star } from '@lucide/svelte';

	let { class: className } = $props<{ class?: string }>();

	import { history } from '$lib/stores/appState';

	const links = [
		{ name: 'Inspect', icon: Search, href: '/' },
		{ name: 'Favorites', icon: Star, href: '/favorites' },
		{ name: 'History', icon: History, href: '/history' }
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
		'bg-neutral-100 px-2 dark:bg-neutral-950',
		className
	)}
>
	<div class="flex h-14 items-center px-6">
		<h2 class="text-xl font-bold tracking-tight dark:text-white">Siteglow</h2>
	</div>

	<nav class="flex flex-col space-y-1 px-2">
		{#each links as link}
			<a
				href={link.href}
				class={cn(
					'flex items-center space-x-3 rounded-md px-2 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
					page.url.pathname === link.href &&
						'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
				)}
			>
				<link.icon size={18} strokeWidth={1.5} />
				<span>{link.name}</span>
			</a>
		{/each}
	</nav>

	{#if $history.length > 0}
		<div class="mt-4 px-2">
			<Separator orientation="horizontal" class="mb-4" />
			<h3
				class="mb-2 px-2 text-xs font-semibold tracking-wider text-neutral-400 uppercase dark:text-neutral-500"
			>
				Recent
			</h3>
			<div class="flex flex-col space-y-1">
				{#each $history.slice(0, 8) as item}
					<a
						href="/inspect/{encodeURIComponent(item.domain)}"
						class="flex items-center space-x-2 rounded-md px-2 py-1.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
					>
						<div
							class="h-4 w-4 overflow-hidden rounded-[4px] border border-neutral-200 bg-white p-[1px] dark:border-neutral-800 dark:bg-neutral-900"
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
						<span class="truncate">{item.name}</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</aside>
