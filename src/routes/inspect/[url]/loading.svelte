<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Layers as LayersIcon } from '@lucide/svelte';
</script>

<div class="mt-6 flex flex-col space-y-2 px-2 font-mono" in:fade>
	<div class="p-px">
		<div class="border border-[var(--whois-border)] bg-[var(--whois-bg)]">
			<div class="flex min-h-[calc(100vh-8rem)] flex-col">
				<!-- Mock Header -->
				<div
					class="flex items-center justify-between border-b border-[var(--whois-border)] bg-[var(--whois-surface)] px-4 py-3"
				>
					<div class="flex items-center space-x-2 text-[var(--whois-text-muted)]">
						<LayersIcon size={14} strokeWidth={2} class="text-[var(--whois-accent)]" />
						<p class="text-[8px] font-black tracking-[0.3em] uppercase">
							<span>Scanning...</span>
						</p>
					</div>
					<div class="flex items-center space-x-2">
						<div
							class="border border-[var(--whois-border)] px-2 py-0.5 text-[8px] font-black tracking-widest text-[var(--whois-accent)] uppercase animate-pulse"
						>
							Initializing
						</div>
					</div>
				</div>

				<!-- Content Skeleton -->
				<div class="space-y-12 p-8">
					<div class="flex items-center gap-6">
						<div
							class="h-16 w-16 animate-pulse border border-[var(--whois-border)] bg-[var(--whois-surface-2)]"
						></div>
						<div class="space-y-3">
							<div class="h-8 w-64 animate-pulse bg-[var(--whois-surface-2)]"></div>
							<div class="h-4 w-48 animate-pulse bg-[var(--whois-surface-2)]"></div>
						</div>
					</div>
					<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
						<div class="space-y-8 lg:col-span-2">
							<div
								class="h-48 w-full animate-pulse border border-[var(--whois-border)] bg-[var(--whois-surface)]"
							></div>
							<div
								class="h-48 w-full animate-pulse border border-[var(--whois-border)] bg-[var(--whois-surface)]"
							></div>
						</div>
						<div
							class="h-96 w-full animate-pulse border border-[var(--whois-border)] bg-[var(--whois-surface)]"
						></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
