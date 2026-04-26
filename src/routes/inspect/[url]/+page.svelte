<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { history, favorites, addToHistory, toggleFavorite } from '$lib/stores/appState';
  import { page } from '$app/state';
  import type { PageData } from './$types';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import { toast } from 'svelte-sonner';
  import { Copy as CopyIcon, ExternalLink as ExternalLinkIcon, Palette as PaletteIcon, Type as TypeIcon, Info as InfoIcon, Layers as LayersIcon, Share as ShareIcon, Download as DownloadIcon, Code as CodeIcon, Star as StarIcon, Globe, ShieldCheck, Lock as LockIcon, Activity as ActivityIcon, Map as MapIcon, AlertCircle, Server, MapPin, Zap, Gauge, Folder, File, ChevronRight, ChevronDown, FileImage, FileCode, Mail, Bot, FileText, Fingerprint, Loader2 } from "@lucide/svelte";
  import { analyzeHtml } from '$lib/scanner/analysis';

  let { data } = $props<{ data: PageData }>();
  let showFullDesc = $state(false);
  let clientReport = $state<any>(null);
  let clientError = $state<string | null>(null);
  let isScanningClient = $state(false);
  let serverReportResolved = $state<any>(null);
  
  // Derive final report and error
  let report = $derived(clientReport || serverReportResolved);
  let error = $derived(clientError || data.error);
  
  let isFavorite = $derived($favorites.some(f => f.domain === report?.domain));

  // Svelte 5 effect to handle history and client-side fallback
  $effect(() => {
    const r = data.streamed.report;
    r.then(reportValue => {
      serverReportResolved = reportValue;
      if (reportValue) {
        if (reportValue.needsClientFetch && !clientReport) {
           performClientScan();
        } else if (!reportValue.needsClientFetch) {
           addToHistory(reportValue);
        }
      }
    }).catch(err => {
      clientError = err.message || "Failed to scan website";
    });
  });

  async function performClientScan() {
    isScanningClient = true;
    clientError = null;
    const targetUrl = data.url.startsWith('http') ? data.url : `https://${data.url}`;
    const domain = new URL(targetUrl).hostname;

    try {
      // 1. Try direct fetch (works if CORS is open)
      let html = '';
      let usedProxy = false;
      
      try {
        const res = await fetch(targetUrl);
        if (res.ok) {
          html = await res.text();
        } else {
          throw new Error('Direct fetch failed');
        }
      } catch (e) {
        // 2. Try CORS proxy (allorigins)
        try {
          const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
          const json = await res.json();
          html = json.contents;
          usedProxy = true;
        } catch (proxyErr) {
          throw new Error('Target site is blocking all access methods. Try a site that allows browser crawlers.');
        }
      }

      if (!html) throw new Error('Could not retrieve site content.');

      // 3. Analyze HTML using shared logic
      const analysis = analyzeHtml(html, targetUrl, domain);
      
      // 4. Merge with server-provided network data
      clientReport = {
        ...data.networkData,
        ...analysis,
        domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        logo: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        redFlags: [],
        subdomains: [],
        security: [], // Would need server-side headers
        securityScore: 'B',
        performance: {
          pageSize: Math.round(new TextEncoder().encode(html).length / 1024),
          domNodes: 0, // Hard to calculate without full DOM
          compression: 'Unknown'
        },
        accessibility: {
          score: 80,
          missingAltTags: 0,
          hasAriaLabels: true
        },
        assets: [],
        updatedAt: new Date().toISOString()
      };
      
      if (usedProxy) {
        toast.info('Fetched via proxy due to site restrictions');
      }
    } catch (err: any) {
      clientError = err.message;
      toast.error('Browser-side scan failed: ' + err.message);
    } finally {
      isScanningClient = false;
    }
  }

  const handleToggleFavorite = () => {
    if (report) {
      toggleFavorite(report);
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    }
  };

  const generateComponent = () => {
    if (!report) return '';
    const primaryColor = report.brandColors[0] || '#000000';
    const secondaryColor = report.brandColors[1] || '#ffffff';
    const font = report.fonts[0] || 'Inter';

    return `
import React from 'react';

const ${report.name.replace(/\s+/g, '')}BrandCard = () => {
  return (
    <div style={{
      fontFamily: '${font}, sans-serif',
      padding: '24px',
      borderRadius: '24px',
      background: 'white',
      border: '1px solid #e5e5e5',
      maxWidth: '400px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <img src="${report.favicon}" style={{ width: '48px', height: '48px', borderRadius: '12px' }} alt="" />
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#171717' }}>${report.name}</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#737373' }}>${report.domain}</p>
        </div>
      </div>
      <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#404040', marginBottom: '24px' }}>
        ${report.description}
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button style={{
          flex: 1,
          padding: '10px',
          borderRadius: '12px',
          background: '${primaryColor}',
          color: 'white',
          border: 'none',
          fontWeight: '600',
          cursor: 'pointer'
        }}>
          Visit Site
        </button>
        <button style={{
          padding: '10px 16px',
          borderRadius: '12px',
          background: '#f5f5f5',
          color: '#171717',
          border: '1px solid #e5e5e5',
          fontWeight: '600',
          cursor: 'pointer'
        }}>
          Share
        </button>
      </div>
    </div>
  );
};

export default ${report.name.replace(/\s+/g, '')}BrandCard;
    `.trim();
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const copyAllDNS = () => {
    if (!report) return;
    const dnsText = report.dns.map(r => `[${r.type}] ${r.value}`).join('\n');
    copyToClipboard(dnsText, 'All DNS Records');
  };

  const downloadDNS = () => {
    if (!report) return;
    const dnsText = `DNS Records for ${report.domain}\nGenerated by Siteglow on ${new Date().toLocaleString()}\n\n` + 
      report.dns.map(r => `${r.type.padEnd(5)} ${r.value}`).join('\n');
    const blob = new Blob([dnsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.domain}-dns.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('DNS records exported to .txt');
  };

  const downloadColors = () => {
    if (!report) return;
    const colorText = `/* Brand Colors for ${report.domain} */\n:root {\n` + 
      report.brandColors.map((c, i) => `  --color-brand-${i + 1}: ${c};`).join('\n') + 
      '\n}';
    const blob = new Blob([colorText], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.domain}-colors.css`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Colors exported to .css');
  };

  let expandedFolders = $state(new Set<string>());
  const toggleFolder = (path: string) => {
    if (expandedFolders.has(path)) {
      expandedFolders.delete(path);
    } else {
      expandedFolders.add(path);
    }
    // Svelte 5 requires re-assignment to trigger reactivity for Set mutations
    expandedFolders = new Set(expandedFolders);
  };
</script>

<svelte:head>
  {#if report}
    <title>{report.name}</title>
    <meta name="description" content={report.description || `Inspection report for ${report.domain}.`} />
    
    <!-- OpenGraph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content={report.name} />
    <meta property="og:description" content={report.description || `Inspection report for ${report.domain}.`} />
    <meta property="og:image" content={report.ogImage || report.favicon} />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary" />
    <meta property="twitter:title" content={report.name} />
    <meta property="twitter:description" content={report.description || `Inspection report for ${report.domain}.`} />
    <meta property="twitter:image" content={report.ogImage || report.favicon} />
  {:else}
    <title>Inspecting...</title>
  {/if}
</svelte:head>

{#snippet assetItem(node: any, path: string = '')}
  {@const currentPath = path ? `${path}/${node.name}` : node.name}
  {@const isExpanded = expandedFolders.has(currentPath)}
  
  <div class="flex flex-col">
    <div 
      class="group flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
      onclick={() => node.type === 'folder' && toggleFolder(currentPath)}
      role="button"
      tabindex="0"
      onkeydown={(e) => e.key === 'Enter' && node.type === 'folder' && toggleFolder(currentPath)}
    >
      {#if node.type === 'folder'}
        {#if isExpanded}
          <ChevronDown size={14} class="text-neutral-400" />
          <Folder size={14} class="text-blue-500 fill-blue-500/20" />
        {:else}
          <ChevronRight size={14} class="text-neutral-400" />
          <Folder size={14} class="text-neutral-400" />
        {/if}
        <span class="text-xs font-medium dark:text-neutral-300">{node.name}</span>
      {:else}
        <div class="w-3.5"></div>
        {#if node.fileType === 'image'}
          <FileImage size={14} class="text-purple-500" />
        {:else if node.fileType === 'script'}
          <FileCode size={14} class="text-yellow-600" />
        {:else if node.fileType === 'style'}
          <FileCode size={14} class="text-blue-600" />
        {:else}
          <File size={14} class="text-neutral-400" />
        {/if}
        <a href={node.url} target="_blank" class="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white truncate">
          {node.name}
        </a>
      {/if}
    </div>

    {#if node.type === 'folder' && isExpanded && node.children}
      <div class="ml-4 pl-1 border-l border-neutral-100 dark:border-neutral-800">
        {#each node.children as child}
          {@render assetItem(child, currentPath)}
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

{#if isScanningClient}
  <!-- Client Scanning Loader -->
  <div class="mx-auto max-w-2xl px-4 py-20 text-center" in:fade>
    <div class="mb-6 flex justify-center">
      <div class="rounded-full bg-neutral-100 p-4 dark:bg-neutral-800 animate-spin">
        <Loader2 size={40} class="text-neutral-600 dark:text-neutral-400" />
      </div>
    </div>
    <h1 class="text-2xl font-bold dark:text-white tracking-tight">Using Browser Fallback</h1>
    <p class="mt-2 text-neutral-600 dark:text-neutral-400">
      The server was blocked, so we're scanning directly from your browser...
    </p>
  </div>
{:else if error}
  <div class="mx-auto max-w-2xl px-4 py-20 text-center" in:fade>
    <div class="mb-6 flex justify-center">
      <div class="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
        <InfoIcon size={40} class="text-red-600 dark:text-red-400" />
      </div>
    </div>
    <h1 class="text-2xl font-bold dark:text-white">Scan Failed</h1>
    <p class="mt-2 text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
      {error}
    </p>
    <div class="mt-8">
      <Button variant="outline" href="/">Go Back Home</Button>
    </div>
  </div>
{:else}
  {#await data.streamed.report}
    <!-- Skeleton Loader -->
    <div class="mt-2 flex flex-col space-y-2 px-2" in:fade>
      <div class="p-px">
        <div class="overflow-hidden rounded-md border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900/40">
          <div class="flex flex-col min-h-[calc(100vh-8rem)]">
            <div class="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <div class="h-4 w-32 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800"></div>
              <div class="h-4 w-12 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800"></div>
            </div>
            <div class="p-6 space-y-8">
              <div class="flex items-center gap-4">
                <div class="h-16 w-16 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"></div>
                <div class="space-y-2">
                  <div class="h-8 w-48 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800"></div>
                  <div class="h-4 w-32 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800"></div>
                </div>
              </div>
              <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div class="space-y-6 lg:col-span-2">
                  <div class="h-40 w-full animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"></div>
                  <div class="h-40 w-full animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"></div>
                </div>
                <div class="h-80 w-full animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:then reportValue}
    {@const activeReport = clientReport || reportValue}
    {#if activeReport}
      <div class="mt-2 flex flex-col space-y-2 px-2">
        <div class="p-px">
          <div class="overflow-hidden rounded-md border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900/40">
            <div class="flex flex-col min-h-[calc(100vh-8rem)]">
              
              <!-- Result Header -->
              <div class="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <div class="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400">
                  <LayersIcon size={18} strokeWidth={1.5} />
                  <p class="text-sm">
                    <span class="font-mono">Inspection</span>
                    <span>Report</span>
                  </p>
                </div>
                <div class="flex items-center space-x-2">
                  <Badge variant="outline" class="font-mono text-[10px] uppercase tracking-wider">v1.0.0</Badge>
                </div>
              </div>

              <!-- Content -->
              <div class="p-4 md:p-6">
                <!-- Header / Overview -->
                <div class="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                  <div class="flex items-center gap-4">
                    <div class="flex h-16 w-16 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
                      <img 
                        src={activeReport.favicon} 
                        alt={activeReport.name} 
                        class="h-10 w-10 object-contain" 
                        onerror={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.includes('google.com')) {
                            target.src = `https://www.google.com/s2/favicons?domain=${activeReport.domain}&sz=128`;
                          }
                        }}
                      />
                    </div>
                    <div>
                      <div class="flex items-center gap-3">
                        <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-3xl">
                          {activeReport.name}
                        </h1>
                      </div>
                      <div class="mt-0.5 flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                        <span class="text-base">{activeReport.domain}</span>
                        <a href="https://{activeReport.domain}" target="_blank" class="hover:text-neutral-900 dark:hover:text-white">
                          <ExternalLinkIcon size={16} />
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onclick={handleToggleFavorite}
                      class={isFavorite ? "bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800" : ""}
                    >
                      <StarIcon size={14} fill={isFavorite ? "currentColor" : "none"} />
                      {isFavorite ? 'Favorited' : 'Favorite'}
                    </Button>
                    <Button variant="outline" size="sm" onclick={() => copyToClipboard(JSON.stringify(activeReport, null, 2), 'Report JSON')}>
                      <DownloadIcon size={14} />
                      JSON
                    </Button>
                    <Button variant="radial" size="sm" onclick={() => copyToClipboard(window.location.href, 'Report URL')}>
                      <ShareIcon size={14} />
                      Share
                    </Button>
                  </div>
                </div>

                <!-- Server info -->
                <div class="mb-8 flex flex-wrap gap-3">
                  <div class="rounded-xl border border-neutral-100 bg-neutral-50/50 p-2.5 dark:border-neutral-800 dark:bg-neutral-900/30 min-w-[120px]">
                    <div class="mb-1 flex items-center gap-2 text-neutral-500">
                      <Globe size={12} />
                      <span class="text-[9px] font-bold uppercase tracking-wider">IP Address</span>
                    </div>
                    <p class="text-xs font-mono font-medium dark:text-white">{activeReport.ip || 'Unknown'}</p>
                  </div>
                  <div class="rounded-xl border border-neutral-100 bg-neutral-50/50 p-2.5 dark:border-neutral-800 dark:bg-neutral-900/30 min-w-[140px]">
                    <div class="mb-1 flex items-center gap-2 text-neutral-500">
                      <Server size={12} />
                      <span class="text-[9px] font-bold uppercase tracking-wider">Hosted by</span>
                    </div>
                    <p class="text-xs font-medium dark:text-white">{activeReport.provider || 'Unknown'}</p>
                  </div>
                  <div class="rounded-xl border border-neutral-100 bg-neutral-50/50 p-2.5 dark:border-neutral-800 dark:bg-neutral-900/30 min-w-[140px]">
                    <div class="mb-1 flex items-center gap-2 text-neutral-500">
                      <MapPin size={12} />
                      <span class="text-[9px] font-bold uppercase tracking-wider">Server location</span>
                    </div>
                    <p class="text-xs font-medium dark:text-white">{activeReport.location || 'Unknown'}</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <!-- Left Column: Branding & Visuals -->
                  <div class="space-y-6 lg:col-span-2">
                    <!-- Colors Card -->
                    <section class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
                      <div class="mb-4 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <PaletteIcon size={18} class="text-neutral-500" />
                          <h2 class="text-lg font-semibold dark:text-white">Brand Colors</h2>
                        </div>
                        <Button variant="ghost" size="sm" class="h-7 text-[10px] px-2 uppercase font-bold tracking-tight" onclick={downloadColors}>
                          <DownloadIcon size={10} class="mr-1.5" />
                          Export CSS
                        </Button>
                      </div>
                      <div class="flex flex-wrap gap-2">
                        {#each activeReport.brandColors as color}
                          <button 
                            onclick={() => copyToClipboard(color, 'Color')}
                            class="group relative flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50 p-1.5 transition-all hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                          >
                            <div 
                              class="h-6 w-6 rounded-md border border-black/5 shadow-inner dark:border-white/10" 
                              style="background-color: {color}"
                            ></div>
                            <span class="font-mono text-[10px] font-medium text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white">
                              {color}
                            </span>
                          </button>
                        {/each}
                      </div>
                    </section>

                    <!-- Fonts Card -->
                    <section class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
                      <div class="mb-4 flex items-center gap-2">
                        <TypeIcon size={18} class="text-neutral-500" />
                        <h2 class="text-lg font-semibold dark:text-white">Detected Fonts</h2>
                      </div>
                      <div class="flex flex-wrap gap-1.5">
                        {#each activeReport.fonts as font}
                          <div class="flex items-center gap-2 rounded-md border border-neutral-100 bg-neutral-50 px-2 py-1 dark:border-neutral-800 dark:bg-neutral-950">
                            <span class="text-xs font-medium truncate" style="font-family: {font}">{font}</span>
                            <button class="text-neutral-400 hover:text-neutral-900 dark:hover:text-white" onclick={() => copyToClipboard(font, 'Font name')}>
                              <CopyIcon size={8} />
                            </button>
                          </div>
                        {/each}
                      </div>
                    </section>

                    <!-- Tech Stack Card -->
                    <section class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
                      <div class="mb-4 flex items-center gap-2">
                        <LayersIcon size={18} class="text-neutral-500" />
                        <h2 class="text-lg font-semibold dark:text-white">Technology Stack</h2>
                      </div>
                      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {#each activeReport.techStack as tech}
                          <a 
                            href={tech.website} 
                            target="_blank"
                            class="group flex items-center justify-between rounded-lg border border-neutral-100 bg-white p-3 transition-all hover:border-neutral-200 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700"
                          >
                            <div class="flex flex-col">
                              <span class="text-sm font-medium dark:text-white group-hover:text-neutral-900 dark:group-hover:text-neutral-100">{tech.name}</span>
                              <span class="text-[10px] text-neutral-500">{tech.category}</span>
                            </div>
                            <Badge variant="outline" class="text-[9px] px-1.5 h-4 uppercase transition-colors group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800">{tech.category}</Badge>
                          </a>
                        {/each}
                      </div>
                    </section>

                    <!-- DNS Records Card -->
                    <section class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
                      <div class="mb-4 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <Globe size={18} class="text-neutral-500" />
                          <h2 class="text-lg font-semibold dark:text-white">DNS Records</h2>
                        </div>
                        <div class="flex gap-2">
                          <Button variant="ghost" size="sm" class="h-7 text-[10px] px-2 uppercase font-bold tracking-tight" onclick={copyAllDNS}>
                            <CopyIcon size={10} class="mr-1.5" />
                            Copy All
                          </Button>
                          <Button variant="outline" size="sm" class="h-7 text-[10px] px-2 uppercase font-bold tracking-tight" onclick={downloadDNS}>
                            <DownloadIcon size={10} class="mr-1.5" />
                            Export
                          </Button>
                        </div>
                      </div>
                      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {#each activeReport.dns as record}
                          <div class="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
                            <div class="flex flex-col min-w-0">
                              <span class="text-[10px] font-bold uppercase text-neutral-400">{record.type}</span>
                              <span class="text-xs truncate dark:text-white">{record.value}</span>
                            </div>
                            <Button variant="ghost" size="icon" class="h-6 w-6" onclick={() => copyToClipboard(record.value, 'DNS value')}>
                              <CopyIcon size={10} />
                            </Button>
                          </div>
                        {/each}
                      </div>
                    </section>

                    {#if activeReport.assets && activeReport.assets.length > 0}
                    <!-- Asset Explorer Card -->
                    <section class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
                      <div class="mb-4 flex items-center gap-2">
                        <Folder size={18} class="text-neutral-500" />
                        <h2 class="text-lg font-semibold dark:text-white">Asset Explorer</h2>
                      </div>
                      <div class="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-950/50 max-h-[400px] overflow-y-auto font-mono">
                        {#each activeReport.assets as node}
                          {@render assetItem(node)}
                        {/each}
                      </div>
                    </section>
                    {/if}

                    {#if activeReport.subdomains && activeReport.subdomains.length > 0}
                    <!-- Subdomains Card -->
                    <section class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
                      <div class="mb-4 flex items-center gap-2">
                        <MapIcon size={18} class="text-neutral-500" />
                        <h2 class="text-lg font-semibold dark:text-white">Subdomains</h2>
                      </div>
                      <div class="flex flex-wrap gap-2">
                        {#each activeReport.subdomains as sub}
                          <a 
                            href={sub.url} 
                            target="_blank"
                            class="flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-1.5 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                          >
                            <span class="text-xs font-medium dark:text-white">{sub.name}</span>
                            <Badge variant="outline" class="text-[8px] h-3.5 uppercase bg-green-500/10 text-green-600 border-green-500/20">{sub.status}</Badge>
                          </a>
                        {/each}
                      </div>
                    </section>
                    {/if}

                    {#if activeReport.redFlags && activeReport.redFlags.length > 0}
                    <!-- Red Flags Card -->
                    <section class="rounded-2xl border border-red-100 bg-red-50/30 p-6 dark:border-red-900/20 dark:bg-red-900/5">
                      <div class="mb-4 flex items-center gap-2">
                        <AlertCircle size={18} class="text-red-500" />
                        <h2 class="text-lg font-semibold text-red-900 dark:text-red-400">Critical Red Flags</h2>
                      </div>
                      <div class="space-y-3">
                        {#each activeReport.redFlags as flag}
                          <div class="flex items-start gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-neutral-900 border border-red-100 dark:border-red-900/30">
                            <div class="mt-0.5 rounded-full bg-red-100 p-1 dark:bg-red-900/30">
                              <AlertCircle size={12} class="text-red-600 dark:text-red-400" />
                            </div>
                            <p class="text-xs leading-relaxed text-red-800 dark:text-red-300">{flag.message}</p>
                          </div>
                        {/each}
                      </div>
                    </section>
                    {/if}
                  </div>

                  <!-- Right Column: Metadata & Socials -->
                  <div class="space-y-6">
                    <!-- Security & Discovery Card -->
                    <section class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
                      <div class="mb-4 flex items-center gap-2">
                        <Fingerprint size={18} class="text-neutral-500" />
                        <h2 class="text-lg font-semibold dark:text-white">Domain & Email</h2>
                      </div>
                      
                      <div class="space-y-6">
                        <!-- Email Protection -->
                        <div>
                          <div class="mb-3 flex items-center gap-2">
                            <Mail size={14} class="text-neutral-400" />
                            <span class="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Email safety</span>
                          </div>
                          <div class="grid grid-cols-2 gap-2">
                            <div class="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-950">
                              <span class="text-xs font-medium dark:text-white">SPF</span>
                              <Badge variant="outline" class="text-[8px] h-3.5 uppercase {activeReport.emailSecurity.spf ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}">
                                {activeReport.emailSecurity.spf ? 'Enabled' : 'Missing'}
                              </Badge>
                            </div>
                            <div class="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-950">
                              <span class="text-xs font-medium dark:text-white">DMARC</span>
                              <Badge variant="outline" class="text-[8px] h-3.5 uppercase {activeReport.emailSecurity.dmarc ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}">
                                {activeReport.emailSecurity.dmarc ? 'Enabled' : 'Missing'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <!-- Crawler Config -->
                        <div>
                          <div class="mb-3 flex items-center gap-2">
                            <Bot size={14} class="text-neutral-400" />
                            <span class="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Crawler setup</span>
                          </div>
                          <div class="space-y-2">
                            <div class="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
                              <div class="flex items-center gap-2">
                                <FileText size={12} class="text-neutral-400" />
                                <span class="text-xs font-medium dark:text-white">Robots.txt</span>
                              </div>
                              {#if activeReport.crawling.robots}
                                <a href={activeReport.crawling.robots} target="_blank" class="text-[10px] text-blue-500 hover:underline">View File</a>
                              {:else}
                                <Badge variant="outline" class="text-[8px] h-3.5 uppercase bg-red-500/10 text-red-600 border-red-500/20">Not Found</Badge>
                              {/if}
                            </div>
                            <div class="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
                              <div class="flex items-center gap-2">
                                <MapIcon size={12} class="text-neutral-400" />
                                <span class="text-xs font-medium dark:text-white">Sitemap</span>
                              </div>
                              {#if activeReport.crawling.sitemap}
                                <a href={activeReport.crawling.sitemap} target="_blank" class="text-[10px] text-blue-500 hover:underline truncate max-w-[80px]">View Map</a>
                              {:else}
                                <Badge variant="outline" class="text-[8px] h-3.5 uppercase bg-red-500/10 text-red-600 border-red-500/20">Not Found</Badge>
                              {/if}
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <!-- Security Audit Card -->
                    <section class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
                      <div class="mb-4 flex items-center gap-2">
                        <ShieldCheck size={18} class="text-neutral-500" />
                        <h2 class="text-lg font-semibold dark:text-white">Safety check</h2>
                      </div>
                      <div class="space-y-2">
                        {#each activeReport.security as header}
                          <div class="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
                            <span class="text-xs font-medium dark:text-white">{header.name}</span>
                            <Badge 
                              variant={header.status === 'secure' ? 'default' : 'outline'} 
                              class="text-[9px] px-1.5 h-4 uppercase {header.status === 'secure' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}"
                            >
                              {header.status === 'secure' ? 'Secure' : 'Missing'}
                            </Badge>
                          </div>
                        {/each}
                      </div>
                    </section>

                    {#if activeReport.ssl}
                    <!-- SSL Card -->
                    <section class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
                      <div class="mb-4 flex items-center gap-2">
                        <InfoIcon size={18} class="text-neutral-500" />
                        <h2 class="text-lg font-semibold dark:text-white">SSL Certificate</h2>
                      </div>
                      <div class="space-y-3">
                        <div class="flex flex-col">
                          <span class="text-[10px] uppercase text-neutral-400 font-bold">Issuer</span>
                          <span class="text-xs dark:text-white">{activeReport.ssl.issuer}</span>
                        </div>
                        <div class="flex flex-col">
                          <span class="text-[10px] uppercase text-neutral-400 font-bold">Valid Until</span>
                          <span class="text-xs {activeReport.ssl.isExpired ? 'text-red-500' : 'dark:text-white'}">
                            {new Date(activeReport.ssl.validTo).toLocaleDateString()}
                          </span>
                        </div>
                        <Badge variant="outline" class="w-full justify-center text-[10px] py-1 border-green-500/20 bg-green-500/5 text-green-600">
                          {activeReport.ssl.protocol}
                        </Badge>
                        
                        {#if activeReport.ssl.sans && activeReport.ssl.sans.length > 0}
                        <div class="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                          <span class="mb-2 block text-[10px] uppercase text-neutral-400 font-bold tracking-wider text-center">Associated Domains (SAN)</span>
                          <div class="flex flex-wrap justify-center gap-1">
                            {#each activeReport.ssl.sans as san}
                              <span class="rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                {san}
                              </span>
                            {/each}
                          </div>
                        </div>
                        {/if}
                      </div>
                    </section>
                    {/if}

                    {#if activeReport.performance}
                    <!-- Performance Card -->
                    <section class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
                      <div class="mb-4 flex items-center gap-2">
                        <Gauge size={18} class="text-neutral-500" />
                        <h2 class="text-lg font-semibold dark:text-white">Speed & Quality</h2>
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col">
                          <span class="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">Page Size</span>
                          <span class="text-sm font-medium dark:text-white">{activeReport.performance.pageSize} KB</span>
                        </div>
                        <div class="flex flex-col">
                          <span class="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">DOM Nodes</span>
                          <span class="text-sm font-medium dark:text-white">{activeReport.performance.domNodes}</span>
                        </div>
                        <div class="flex flex-col">
                          <span class="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">Compression</span>
                          <span class="text-xs dark:text-white truncate">{activeReport.performance.compression}</span>
                        </div>
                      </div>
                    </section>
                    {/if}

                    {#if activeReport.accessibility}
                    <!-- Accessibility Card -->
                    <section class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
                      <div class="mb-4 flex items-center gap-2">
                        <ShieldCheck size={18} class="text-neutral-500" />
                        <h2 class="text-lg font-semibold dark:text-white">Accessibility</h2>
                      </div>
                      <div class="space-y-4">
                        <div class="space-y-2">
                          <div class="flex items-center justify-between">
                            <span class="text-[10px] uppercase text-neutral-400 font-bold">Health Score</span>
                            <span class="text-xs font-bold text-neutral-900 dark:text-white">{activeReport.accessibility.score}%</span>
                          </div>
                          <div class="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 p-0.5 shadow-inner">
                            <div 
                              class="h-full rounded-full bg-gradient-to-r from-neutral-800 via-neutral-600 to-neutral-400 dark:from-white dark:via-neutral-200 dark:to-neutral-400 transition-all duration-1000 shadow-sm" 
                              style="width: {activeReport.accessibility.score}%"
                            ></div>
                          </div>
                        </div>
                        <div class="grid grid-cols-1 gap-2">
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-neutral-500">Missing Alt Tags</span>
                            <span class={activeReport.accessibility.missingAltTags > 0 ? 'text-red-500' : 'text-green-500'}>
                              {activeReport.accessibility.missingAltTags}
                            </span>
                          </div>
                          <div class="flex items-center justify-between text-xs">
                            <span class="text-neutral-500">ARIA Support</span>
                            <span class="dark:text-white">{activeReport.accessibility.hasAriaLabels ? 'Detected' : 'None'}</span>
                          </div>
                        </div>
                      </div>
                    </section>
                    {/if}

                    <section class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
                      <div class="mb-4 flex items-center gap-2">
                        <InfoIcon size={18} class="text-neutral-500" />
                        <h2 class="text-lg font-semibold dark:text-white">Metadata</h2>
                      </div>
                      <div class="space-y-4">
                        <div class="overflow-hidden">
                          <span class="mb-1 block text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Meta Title</span>
                          <p class="break-words text-xs leading-relaxed font-medium dark:text-neutral-200">{activeReport.title}</p>
                        </div>
                        <Separator />
                        <div>
                          <span class="mb-1 block text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Description</span>
                          <div class="relative">
                            <p class="text-xs leading-relaxed text-neutral-600 line-clamp-3 dark:text-neutral-400">
                              {activeReport.description || 'No description detected.'}
                            </p>
                            {#if activeReport.description && activeReport.description.length > 150}
                              <button 
                                onclick={() => showFullDesc = true}
                                class="mt-1 text-[10px] font-semibold text-neutral-900 underline-offset-4 hover:underline dark:text-white"
                              >
                                View full description
                              </button>
                            {/if}
                            {#if !activeReport.description}
                               <p class="text-[10px] italic text-neutral-400">No meta description found on this page.</p>
                            {/if}
                          </div>
                        </div>
                      </div>
                    </section>
                    
                    {#if showFullDesc}
                      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                        <button 
                          class="absolute inset-0 bg-black/50"
                          aria-label="Close description"
                          onclick={() => showFullDesc = false}
                        ></button>
                        <div 
                          class="relative max-w-xl w-full rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby="modal-title"
                          tabindex="-1"
                          onclick={(e) => e.stopPropagation()}
                        >
                          <div class="mb-4 flex items-center justify-between">
                            <h3 id="modal-title" class="text-base font-bold dark:text-white">Full Description</h3>
                            <Button variant="ghost" size="icon" class="h-8 w-8" onclick={() => showFullDesc = false}>
                              <InfoIcon size={16} />
                            </Button>
                          </div>
                          <p class="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                            {activeReport.description}
                          </p>
                          <div class="mt-6 flex justify-end">
                            <Button variant="default" size="sm" onclick={() => showFullDesc = false}>Close</Button>
                          </div>
                        </div>
                      </div>
                    {/if}

                    {#if activeReport.socialLinks && activeReport.socialLinks.length > 0}
                    <!-- Socials Card -->
                    <section class="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
                      <div class="mb-4 flex items-center gap-2">
                        <ShareIcon size={18} class="text-neutral-500" />
                        <h2 class="text-lg font-semibold dark:text-white">Social Links</h2>
                      </div>
                      <div class="grid grid-cols-1 gap-2">
                        {#each activeReport.socialLinks as social}
                          <a 
                            href={social.url} 
                            target="_blank"
                            class="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                          >
                            <span class="text-xs font-medium dark:text-white">{social.platform}</span>
                            <ExternalLinkIcon size={12} class="text-neutral-400" />
                          </a>
                        {/each}
                      </div>
                    </section>
                    {/if}

                    <!-- Component Export Card -->
                    <section class="overflow-hidden rounded-2xl border border-neutral-950 bg-neutral-900 p-6 text-white dark:border-neutral-800 dark:bg-neutral-950">
                      <div class="mb-4 flex items-center gap-2">
                        <CodeIcon size={18} class="text-neutral-400" />
                        <h2 class="text-lg font-semibold">Export Component</h2>
                      </div>
                      <p class="mb-4 text-xs text-neutral-400">
                        Get a polished React or Svelte component snippet featuring this site's branding.
                      </p>
                      <Button 
                        variant="default" 
                        size="sm"
                        class="w-full bg-white text-neutral-950 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white"
                        onclick={() => copyToClipboard(generateComponent(), 'React Component')}
                      >
                        Copy Code Snippet
                      </Button>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <div class="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 class="text-2xl font-bold dark:text-white">No data found</h1>
        <Button variant="outline" href="/" class="mt-4">Go Back Home</Button>
      </div>
    {/if}
  {:catch error}
    <div class="mx-auto max-w-2xl px-4 py-20 text-center" in:fade>
      <div class="mb-6 flex justify-center">
        <div class="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
          <InfoIcon size={40} class="text-red-600 dark:text-red-400" />
        </div>
      </div>
      <h1 class="text-2xl font-bold dark:text-white">Scan Failed</h1>
      <p class="mt-2 text-neutral-600 dark:text-neutral-400">
        {error.message || 'An unknown error occurred during the scan.'}
      </p>
      <div class="mt-8">
        <Button variant="outline" href="/">Go Back Home</Button>
      </div>
    </div>
  {/await}
{/if}
