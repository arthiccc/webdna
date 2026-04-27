<script lang="ts">
	import { fade, slide, fly } from 'svelte/transition';
	import { Map as MapIcon, Loader2, X as XIcon } from '@lucide/svelte';

	import { DNS_GROUPS, DNS_TYPE_INFO, ALL_DNS_TYPES, formatTTL } from '$lib/dns-types';
	import type { DnsTypeResult } from '$lib/dns-types';

	let { domain } = $props();

	import { geoEquirectangular, geoPath, geoGraticule10 } from 'd3-geo';
	import { feature } from 'topojson-client';
	import worldJson from 'world-atlas/countries-110m.json';
	import 'flag-icons/css/flag-icons.min.css';

	// ─── World map (computed once, module-level) ─────────────────────────────────
	const MAP_W = 960, MAP_H = 500;
	const _proj  = geoEquirectangular().fitSize([MAP_W, MAP_H], { type: 'Sphere' });
	const _path  = geoPath(_proj);
	const _land  = feature(worldJson as any, (worldJson as any).objects.land);
	const _grat  = geoGraticule10();
	const landPath   = _path(_land as any) ?? '';
	const gratPath   = _path(_grat as any) ?? '';
	const spherePath = _path({ type: 'Sphere' }) ?? '';
	function project(lon: number, lat: number): [number, number] | null {
		return _proj([lon, lat]) as [number, number] | null;
	}

	type GroupKey = keyof typeof DNS_GROUPS | 'all';

	// ─── State ───────────────────────────────────────────────────────────────────
	let query       = $state('');
	let activeGroup = $state<GroupKey>('all');
	let submitted   = $state('');
	let showAllRecords = $state(false);

	let dnsRecords  = $state<Record<string, DnsTypeResult>>({});
	let rdapData    = $state<Record<string, any> | null>(null);
	let dnsLoading  = $state(false);
	let rdapLoading = $state(false);
	let dnsError    = $state('');
	let rdapError   = $state('');

	const ALL_PROP_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'PTR', 'SRV', 'SOA', 'TXT', 'CAA', 'DS', 'DNSKEY'] as const;

	interface PropResult {
		id: string; name: string; city: string; flag: string; iso: string;
		lat: number; lon: number;
		records: string[]; ttl: number | null;
		status: 'ok' | 'nxdomain' | 'error' | 'timeout'; ms: number;
		ip?: string; region?: string;
	}
	let propResults  = $state<PropResult[]>([]);
	let propLoading  = $state(false);
	let propType     = $state('A');
	let hoveredId    = $state<string | null>(null);
	let mapTooltip   = $state<{ r: PropResult; x: number; y: number } | null>(null);
	let selectedNode = $state<PropResult | null>(null);

	const majorityRecord = $derived.by((): string => {
		const counts = new Map<string, number>();
		for (const r of propResults) for (const rec of r.records) counts.set(rec, (counts.get(rec) ?? 0) + 1);
		let max = 0, best = '';
		for (const [rec, n] of counts) if (n > max) { max = n; best = rec; }
		return best;
	});

	function propColor(r: PropResult): string {
		if (r.status === 'ok') return r.records.includes(majorityRecord) ? 'var(--whois-accent)' : '#f97316';
		if (r.status === 'nxdomain') return '#ef4444';
		return '#3a3a3a';
	}

	function selectPropType(t: string) {
		propType = t;
		if (submitted) searchPropagation(submitted, t);
	}

	// ─── DNS helpers ─────────────────────────────────────────────────────────────
	const groups: { key: GroupKey; label: string }[] = [
		{ key: 'core',     label: 'Core'     },
		{ key: 'security', label: 'Security' },
		{ key: 'services', label: 'Services' },
		{ key: 'all',      label: 'All'      }
	];

	function getTypesForGroup(g: GroupKey): string[] {
		if (g === 'all') return [...ALL_DNS_TYPES];
		return [...DNS_GROUPS[g].types];
	}

	function filteredRecords() {
		const types = getTypesForGroup(activeGroup);
		return Object.fromEntries(
			Object.entries(dnsRecords).filter(([t, r]) => types.includes(t) && (r as DnsTypeResult).answers.length > 0)
		);
	}

	function totalDnsFound() {
		return Object.values(dnsRecords).reduce((s, r) => s + (r as DnsTypeResult).answers.length, 0);
	}

	function countForGroup(key: GroupKey): number {
		return Object.entries(dnsRecords).filter(([t, r]) =>
			getTypesForGroup(key).includes(t) && (r as DnsTypeResult).answers.length > 0
		).length;
	}

	// ─── Actions ─────────────────────────────────────────────────────────────────
	async function submit() {
		const raw = query.trim();
		if (!raw || dnsLoading || rdapLoading) return;
		const domain = raw.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
		submitted   = domain;
		dnsRecords  = {};
		rdapData    = null;
		propResults = [];
		dnsError    = '';
		rdapError   = '';
		activeGroup = 'all';

		searchDNS(domain);
		searchRDAP(domain);
		searchPropagation(domain);
	}

	async function searchDNS(domain: string) {
		dnsLoading = true;
		try {
			const res  = await fetch(`/api/dns?domain=${encodeURIComponent(domain)}&types=${[...ALL_DNS_TYPES].join(',')}`);
			const data = await res.json();
			if (data.error) dnsError = data.error;
			else dnsRecords = data.records ?? {};
		} catch { dnsError = 'DNS query failed'; }
		finally { dnsLoading = false; }
	}

	async function searchRDAP(domain: string) {
		rdapLoading = true;
		try {
			const res  = await fetch(`/api/rdap?domain=${encodeURIComponent(domain)}`);
			const data = await res.json();
			if (data.error) rdapError = data.error;
			else rdapData = data;
		} catch { rdapError = 'RDAP query failed'; }
		finally { rdapLoading = false; }
	}

	async function searchPropagation(domain: string, type = propType) {
		propLoading = true;
		try {
			const res  = await fetch(`/api/propagation?domain=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`);
			const data = await res.json();
			if (!data.error) propResults = data.results;
		} catch {}
		finally { propLoading = false; }
	}

	$effect(() => {
		if (domain && domain !== submitted) {
			query = domain;
			submit();
		}
	});

	const EVENT_LABELS: Record<string, string> = {
		'registration':               'Registered',
		'expiration':                 'Expires',
		'last changed':               'Updated',
		'last update of RDAP database': 'RDAP sync',
		'transfer':                   'Transferred',
	};

	const ROLE_LABELS: Record<string, string> = {
		registrar:      'Registrar',
		registrant:     'Registrant',
		administrative: 'Admin Contact',
		technical:      'Technical Contact',
		abuse:          'Abuse Contact',
	};

	function fmtDate(iso?: string): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function parseVcard(vcardArray: unknown[]): any {
		const out: any = {};
		if (!Array.isArray(vcardArray?.[1])) return out;
		for (const field of vcardArray[1] as any[]) {
			if (!Array.isArray(field)) continue;
			const [name, , , value] = field;
			if (name === 'fn') out.name = value;
			if (name === 'org') out.org = Array.isArray(value) ? value[0] : value;
			if (name === 'email') (out.emails ??= []).push(value);
		}
		return out;
	}

	function parseEntity(e: any): any {
		return {
			roles: e.roles || [],
			vcard: parseVcard(e.vcardArray || []),
			handle: e.handle
		};
	}

	function flattenEntities(data: any): any[] {
		if (!data?.entities) return [];
		return data.entities.map(parseEntity);
	}

	function sortEntities(entities: any[]): any[] {
		const order = ['registrar', 'registrant', 'abuse', 'administrative', 'technical'];
		return [...entities].sort((a, b) => {
			const ai = order.indexOf(a.roles[0]);
			const bi = order.indexOf(b.roles[0]);
			return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
		});
	}
</script>

<div class="space-y-12">
	{#if dnsLoading}
		<div class="flex flex-col items-center justify-center p-20 gap-8 bg-[var(--whois-surface)] border border-[var(--whois-border)]" transition:fade={{ duration: 200 }}>
			<div class="relative">
				<Loader2 size={56} class="text-[var(--whois-accent)] animate-spin opacity-40" />
				<div class="absolute inset-0 blur-xl bg-[var(--whois-accent)] opacity-20 animate-pulse"></div>
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs font-black uppercase tracking-[0.5em] text-[var(--whois-accent)]">Scanning domain...</span>
				<span class="text-[10px] font-bold text-[var(--whois-text-muted)] uppercase tracking-widest opacity-50 animate-pulse">{submitted}</span>
			</div>
		</div>
	{:else}
		<div class="space-y-8" transition:fade={{ duration: 300 }}>
			
			<!-- GLOBAL PROPAGATION SECTION (Mission Control) -->
			<section class="border border-[var(--whois-border)] bg-[var(--whois-surface)] group/infra overflow-hidden">
				<div class="px-5 py-3 border-b border-[var(--whois-border)] bg-[var(--whois-surface-2)]/30">
					<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
						<div class="flex items-center gap-3">
							<div class="flex flex-col gap-0.5">
								<h2 class="text-[10px] font-black text-[var(--whois-accent)] uppercase tracking-[0.25em] leading-none">Propagation</h2>
								<p class="text-[8px] font-bold text-[var(--whois-text-muted)] uppercase tracking-widest opacity-40">Global DNS Status</p>
							</div>
						</div>
						
						<div class="flex items-center gap-1 overflow-x-auto no-scrollbar">
							{#each ALL_PROP_TYPES as t}
								<button
									class="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap {propType === t ? 'text-[var(--whois-accent)]' : 'text-[var(--whois-text-muted)]/30 hover:text-[var(--whois-accent)]'}"
									onclick={() => selectPropType(t)}
								>
									{t}
								</button>
							{/each}
						</div>
					</div>
				</div>

				<div class="relative bg-[var(--whois-bg)] overflow-hidden aspect-[16/8] min-h-[480px] group/map">
					<!-- Technical Overlay -->
					<div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: radial-gradient(circle at 2px 2px, var(--whois-accent) 1px, transparent 0); background-size: 24px 24px;"></div>
					
					<svg class="w-full h-full relative z-10 transition-opacity duration-500 {propLoading ? 'opacity-30 grayscale' : 'opacity-100 grayscale-0'}" viewBox="0 0 960 500" preserveAspectRatio="xMidYMid meet">
						<path class="fill-[var(--whois-surface-2)]" d={spherePath} />
						<path class="fill-[var(--whois-surface)] stroke-[var(--whois-border)] stroke-[0.5]" d={landPath} />
						
						{#each propResults as r}
							{@const pos = project(r.lon, r.lat)}
							{#if pos}
								<g
									class="cursor-pointer"
									onmouseenter={(e) => { hoveredId = r.id; mapTooltip = { r, x: e.clientX, y: e.clientY }; }}
									onmousemove={(e) => { mapTooltip = { r, x: e.clientX, y: e.clientY }; }}
									onmouseleave={() => { hoveredId = null; mapTooltip = null; }}
									onclick={() => selectedNode = selectedNode?.id === r.id ? null : r}
								>
									<!-- Hit Area (Transparent) -->
									<circle
										cx={pos[0]}
										cy={pos[1]}
										r="12"
										fill="transparent"
									/>
									<!-- Visual Dot -->
									<circle
										cx={pos[0]}
										cy={pos[1]}
										r={hoveredId === r.id || selectedNode?.id === r.id ? 3.5 : 2}
										fill={propColor(r)}
										class="transition-all duration-300 pointer-events-none {selectedNode?.id === r.id ? 'stroke-white stroke-[1.5px]' : ''}"
									/>
								</g>
							{/if}
						{/each}
					</svg>
					
					<div class="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-r from-transparent via-[var(--whois-accent)]/10 to-transparent w-[50%] h-full -skew-x-12 -translate-x-[200%] animate-[shimmer_8s_infinite]"></div>

					{#if selectedNode}
						<div 
							class="absolute top-4 right-4 z-50 w-72 border-2 border-[var(--whois-accent)] bg-[var(--whois-surface)]/95 p-5 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-md pointer-events-auto"
							transition:fly={{ x: 30, duration: 300 }}
						>
							<div class="mb-4 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<div class="w-1.5 h-1.5 rounded-full" style="background-color: {propColor(selectedNode)}"></div>
									<span class="text-[10px] font-black tracking-widest text-[var(--whois-text)] uppercase">{selectedNode.city}</span>
								</div>
								<button 
									onclick={() => selectedNode = null}
									class="text-[var(--whois-text-muted)] hover:text-[var(--whois-accent)]"
								>
									<XIcon size={14} />
								</button>
							</div>

							<div class="space-y-3">
								<div class="flex justify-between items-center border-b border-[var(--whois-border)]/50 pb-2">
									<span class="text-[10px] font-bold text-[var(--whois-text-muted)] uppercase tracking-widest">Status</span>
									<span class="text-xs font-black uppercase {selectedNode.status === 'ok' ? 'text-emerald-400' : 'text-amber-400'}">
										{selectedNode.status === 'ok' ? 'Online' : selectedNode.status.toUpperCase()}
									</span>
								</div>
								<div class="flex justify-between items-center border-b border-[var(--whois-border)]/50 pb-2">
									<span class="text-[10px] font-bold text-[var(--whois-text-muted)] uppercase tracking-widest">Latency</span>
									<span class="text-xs font-mono text-[var(--whois-text)] font-bold">{selectedNode.ms}ms</span>
								</div>
								<div class="flex justify-between items-center border-b border-[var(--whois-border)]/50 pb-2">
									<span class="text-[10px] font-bold text-[var(--whois-text-muted)] uppercase tracking-widest">IP Address</span>
									<span class="text-xs font-mono text-[var(--whois-accent)]/70">{selectedNode.ip || '0.0.0.0'}</span>
								</div>
								<div class="flex justify-between items-center">
									<span class="text-[10px] font-bold text-[var(--whois-text-muted)] uppercase tracking-widest">Region</span>
									<span class="text-xs font-bold text-[var(--whois-text)] uppercase tracking-widest">{selectedNode.region || 'Unknown'}</span>
								</div>
							</div>

							{#if selectedNode.records.length > 0}
								<div class="mt-4 pt-4 border-t border-[var(--whois-border)]">
									<div class="flex items-center justify-between mb-3">
										<span class="text-[9px] font-black uppercase tracking-widest text-[var(--whois-accent)]">Records</span>
										<span class="text-[8px] font-bold text-[var(--whois-text-muted)] uppercase">{selectedNode.records.length} Found</span>
									</div>
									<div class="custom-scrollbar max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
										{#each selectedNode.records as rec}
											<div class="text-[9px] font-mono text-[var(--whois-text)] bg-[var(--whois-surface-2)] px-2 py-1.5 border border-[var(--whois-border)] break-all leading-tight">
												{rec}
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}

					{#if propLoading}
						<div class="absolute inset-0 z-20 bg-[var(--whois-bg)]/40 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300">
							<div class="flex flex-col items-center gap-4">
								<div class="relative">
									<Loader2 size={24} class="text-[var(--whois-accent)] animate-spin opacity-60" />
									<div class="absolute inset-0 border border-[var(--whois-accent)]/20 rounded-full animate-ping"></div>
								</div>
								<div class="flex flex-col items-center gap-1 text-center">
									<span class="text-[8px] font-black uppercase tracking-[0.6em] text-[var(--whois-accent)] animate-pulse">Checking nodes...</span>
									<span class="text-[6px] font-bold text-[var(--whois-text-muted)] uppercase tracking-widest opacity-30">Loading regional data</span>
								</div>
							</div>
						</div>
					{/if}

					{#if mapTooltip}
						<div 
							class="fixed pointer-events-none z-[1000] bg-[var(--whois-bg)] border border-[var(--whois-border)] p-4 shadow-2xl min-w-[240px] backdrop-blur-xl border-l-4" 
							style="left:{mapTooltip.x}px;top:{mapTooltip.y}px;transform:translate(15px, -50%); border-left-color: {propColor(mapTooltip.r)}"
						>
							<div class="flex items-center gap-3 mb-3 pb-2 border-b border-[var(--whois-border)]">
								<span class="fi fi-{mapTooltip.r.iso.toLowerCase()} text-[14px]"></span>
								<div class="flex-1">
									<div class="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--whois-text)]">{mapTooltip.r.city}</div>
									<div class="text-[8px] font-bold text-[var(--whois-text-muted)] uppercase tracking-[0.1em]">{mapTooltip.r.name}</div>
								</div>
							</div>
							
							{#if mapTooltip.r.records.length}
								<div class="mb-2 flex items-center justify-between">
									<span class="text-[9px] font-black uppercase tracking-widest text-[var(--whois-accent)]">Active Records</span>
									<span class="text-[8px] font-bold text-[var(--whois-text-muted)] uppercase">{mapTooltip.r.records.length} Total</span>
								</div>
								<div class="space-y-1.5">
									{#each mapTooltip.r.records.slice(0, 3) as rec}
										<div class="text-[10px] font-mono text-[var(--whois-accent)] bg-[var(--whois-accent)]/5 px-2 py-1.5 border border-[var(--whois-accent)]/10 flex items-center justify-between">
											<span class="truncate pr-2">{rec}</span>
											<span class="shrink-0 text-[7px] font-black text-emerald-400">200 OK</span>
										</div>
									{/each}
									{#if mapTooltip.r.records.length > 3}
										<div class="text-[8px] font-black text-[var(--whois-accent)]/50 uppercase tracking-widest text-center pt-1 animate-pulse">
											+ {mapTooltip.r.records.length - 3} more records (Click to view)
										</div>
									{/if}
								</div>
								<div class="flex items-center justify-between mt-3 text-[8px] font-black text-[var(--whois-text-muted)] uppercase tracking-[0.1em] opacity-60">
									<span>TTL {mapTooltip.r.ttl}s</span>
									<span class="font-mono text-[var(--whois-accent)]">{mapTooltip.r.ms}ms</span>
								</div>
							{:else}
								<div class="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-1.5 border border-red-500/10 flex items-center justify-between">
									<span>{mapTooltip.r.status}</span>
									<span class="animate-pulse">!</span>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Single-Line Resolver Ticker -->
				<div class="flex items-center gap-6 px-6 py-3 bg-[var(--whois-bg)] overflow-x-auto no-scrollbar border-t border-[var(--whois-border)]">
					{#each propResults as r}
						<button 
							class="flex items-center gap-2 shrink-0 group cursor-pointer"
							onclick={() => selectedNode = selectedNode?.id === r.id ? null : r}
						>
							<div class="w-1 h-1 rounded-full opacity-40 group-hover:opacity-100 transition-opacity" style="background-color: {propColor(r)}"></div>
							<span class="text-[10px] font-black text-[var(--whois-text-muted)] uppercase tracking-widest group-hover:text-[var(--whois-accent)] transition-colors whitespace-nowrap {selectedNode?.id === r.id ? 'text-[var(--whois-accent)]' : ''}">{r.city}</span>
						</button>
					{/each}
				</div>
			</section>

			<!-- DNS RECORDS SECTION -->
			<section class="border border-[var(--whois-border)] bg-[var(--whois-surface)] p-6">
				<div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div class="flex flex-col gap-1">
						<h2 class="text-sm font-black text-[var(--whois-accent)] uppercase tracking-[0.2em] leading-none">DNS Records</h2>
						<p class="text-[10px] font-bold text-[var(--whois-text-muted)] uppercase tracking-widest opacity-40">{totalDnsFound()} entries found</p>
					</div>
					
					<div class="flex items-center gap-2">
						{#each groups as g}
							{@const n = g.key === 'all' ? Object.keys(dnsRecords).length : countForGroup(g.key)}
							{#if g.key === 'all' || n > 0}
								<button
									class="px-2 py-1 text-[10px] font-black uppercase tracking-widest transition-all {activeGroup === g.key ? 'text-[var(--whois-accent)]' : 'text-[var(--whois-text-muted)]/40 hover:text-[var(--whois-accent)]'}"
									onclick={() => (activeGroup = g.key)}
								>
									{g.label}
								</button>
							{/if}
						{/each}
					</div>
				</div>

				{#if dnsError}
					<div class="p-6 border border-[var(--whois-border)] text-red-500 text-[9px] font-bold uppercase tracking-widest text-center">{dnsError}</div>
				{:else if Object.keys(filteredRecords()).length === 0}
					<div class="p-12 text-center text-[9px] font-bold text-[var(--whois-text-muted)] uppercase tracking-widest opacity-20 border border-[var(--whois-border)] border-dashed">No records detected</div>
				{:else}
					{@const allAnswers = Object.entries(filteredRecords()).flatMap(([type, result]) => 
						(result as DnsTypeResult).answers.map(a => ({ type, ...a }))
					)}
					{@const visibleAnswers = showAllRecords ? allAnswers : allAnswers.slice(0, 8)}

					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
						{#each visibleAnswers as answer}
							<div class="group border border-[var(--whois-border)] bg-[var(--whois-surface-2)] px-4 py-3 hover:border-[var(--whois-accent)]/20 transition-all">
								<div class="flex items-center justify-between mb-2.5 pb-2 border-b border-[var(--whois-border)]/50">
									<span class="text-xs font-black uppercase tracking-[0.1em] text-[var(--whois-accent)] opacity-60">{answer.type}</span>
									<span class="text-[8px] font-bold text-[var(--whois-text-muted)] uppercase tracking-widest opacity-30">{answer.TTL}s</span>
								</div>
								<p class="text-sm font-mono text-[var(--whois-text-muted)]/90 break-all leading-relaxed selection:bg-[var(--whois-accent)] selection:text-black">{answer.data}</p>
							</div>
						{/each}
					</div>

					{#if allAnswers.length > 8 && !showAllRecords}
						<button 
							class="mt-6 w-full py-4 border border-dashed border-[var(--whois-border)] bg-[var(--whois-surface-2)]/30 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--whois-text-muted)] hover:border-[var(--whois-accent)] hover:text-[var(--whois-accent)] transition-all"
							onclick={() => showAllRecords = true}
						>
							Show All {allAnswers.length} Records
						</button>
					{/if}
				{/if}
			</section>

			<!-- REGISTRATION DATA SECTION -->
			<section class="border border-[var(--whois-border)] bg-[var(--whois-surface)] p-6">
				<div class="mb-6">
					<h2 class="text-sm font-black text-[var(--whois-accent)] uppercase tracking-[0.2em] leading-none">Domain Registration</h2>
					<p class="text-[10px] font-bold text-[var(--whois-text-muted)] uppercase tracking-widest opacity-40">Registry details</p>
				</div>

				{#if rdapLoading}
					<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
						{#each { length: 4 } as _}
							<div class="h-20 bg-[var(--whois-surface-2)] border border-[var(--whois-border)] animate-pulse"></div>
						{/each}
					</div>
				{:else if rdapData}
					<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
						<div class="border border-[var(--whois-border)] bg-[var(--whois-surface-2)] p-5">
							<h3 class="text-xs font-black uppercase tracking-[0.1em] text-[var(--whois-accent)] mb-4 opacity-50">Domain</h3>
							<div class="space-y-4">
								<div>
									<span class="block text-[10px] font-bold text-[var(--whois-text-muted)] uppercase tracking-widest mb-1">Hostname</span>
									<span class="text-sm font-mono text-[var(--whois-text)] font-bold">{rdapData.ldhName}</span>
								</div>
								<div class="flex flex-wrap gap-1.5">
									{#each (rdapData.status || []) as s}
										<span class="px-1.5 py-0.5 border border-[var(--whois-border)] bg-[var(--whois-surface)] text-[10px] font-black text-[var(--whois-text-muted)] uppercase tracking-widest opacity-50">{s}</span>
									{/each}
								</div>
							</div>
						</div>

						<div class="border border-[var(--whois-border)] bg-[var(--whois-surface-2)] p-5">
							<h3 class="text-sm font-black uppercase tracking-[0.1em] text-[var(--whois-accent)] mb-4 opacity-50">Dates</h3>
							<div class="space-y-4">
								{#each (rdapData.events || []).filter(e => EVENT_LABELS[e.eventAction]) as ev}
									<div class="flex justify-between items-center">
										<span class="text-xs font-bold text-[var(--whois-text-muted)] uppercase tracking-widest">{EVENT_LABELS[ev.eventAction]}</span>
										<span class="text-sm font-mono text-[var(--whois-text)] font-bold">{fmtDate(ev.eventDate)}</span>
									</div>
								{/each}
							</div>
						</div>

						{#each sortEntities(flattenEntities(rdapData)).slice(0, 2) as entity}
							{@const vcard = entity.vcard}
							{#if vcard.name || vcard.org}
								<div class="border border-[var(--whois-border)] bg-[var(--whois-surface-2)] p-5">
									<h3 class="text-sm font-black uppercase tracking-[0.1em] text-[var(--whois-accent)] mb-4 opacity-50">
										{ROLE_LABELS[entity.roles[0]] || 'Contact'}
									</h3>
									<div class="space-y-4">
										{#if vcard.name}
											<div class="text-[10px] font-bold text-[var(--whois-text)] truncate">{vcard.name}</div>
										{/if}
										{#if vcard.org}
											<div class="text-[9px] text-[var(--whois-text-muted)] truncate">{vcard.org}</div>
										{/if}
										{#if vcard.emails?.[0]}
											<div class="text-[9px] font-mono text-[var(--whois-accent)]/50 truncate">{vcard.emails[0]}</div>
										{/if}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{:else}
					<div class="p-16 text-center text-[9px] font-bold text-[var(--whois-text-muted)] uppercase tracking-widest opacity-20">No registry data</div>
				{/if}
			</section>
		</div>
	{/if}
</div>

<style>
	@keyframes shimmer {
		0% { transform: translateX(-200%) skewX(-12deg); }
		100% { transform: translateX(300%) skewX(-12deg); }
	}
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
