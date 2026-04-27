<script lang="ts">
  import "../app.css";
  import { ModeWatcher } from "mode-watcher";
  import { Toaster } from "svelte-sonner";
  import { dev } from '$app/environment';
  import { navigating } from '$app/state';
  import { fade } from 'svelte/transition';
  import Header from "$lib/components/layout/Header.svelte";
  import Sidebar from "$lib/components/layout/Sidebar.svelte";
  import { Layers as LayersIcon } from '@lucide/svelte';

  let { children, data } = $props();

  // Check if we are navigating to an inspection page
  let isNavigatingToInspect = $derived(navigating?.to?.url.pathname.startsWith('/inspect/'));
</script>

<svelte:head>
  {#if !dev && !data.isBot}
    <script defer src="/stats/script.js" data-website-id="0a8cf48d-1fe0-45ad-8ffb-326c95da9e3f" data-host-url="/stats"></script>
  {/if}
</svelte:head>

<ModeWatcher defaultMode="dark" />
<Toaster 
  position="bottom-right" 
  theme="dark" 
  richColors 
  closeButton
  visibleToasts={1}
  toastOptions={{
    class: 'group !bg-white dark:!bg-neutral-900 !border-neutral-200 dark:!border-neutral-800 !shadow-[0_20px_50px_rgba(0,0,0,0.1)] !rounded-none !px-4 !py-3 !font-medium !text-sm',
    descriptionClass: '!text-neutral-500 !text-xs'
  }}
/>

<Header />
<section>
  <Sidebar />
  <main class="px-2 md:mr-4 md:ml-56 md:px-0">
    {#if isNavigatingToInspect}
      <div class="mt-6 flex flex-col space-y-2 px-2 font-mono" in:fade>
        <div class="p-px">
          <div class="border border-[var(--whois-border)] bg-[var(--whois-bg)]">
            <div class="flex min-h-[calc(100vh-8rem)] flex-col">
              <div class="flex items-center justify-between border-b border-[var(--whois-border)] bg-[var(--whois-surface)] px-4 py-3">
                <div class="flex items-center space-x-2 text-[var(--whois-text-muted)]">
                  <LayersIcon size={14} strokeWidth={2} class="text-[var(--whois-accent)]" />
                  <p class="text-[8px] font-black tracking-[0.3em] uppercase"><span>Scanning...</span></p>
                </div>
                <div class="flex items-center space-x-2">
                  <div class="border border-[var(--whois-border)] px-2 py-0.5 text-[8px] font-black tracking-widest text-[var(--whois-accent)] uppercase animate-pulse">
                    Initializing
                  </div>
                </div>
              </div>
              <div class="space-y-12 p-8">
                <div class="flex items-center gap-6">
                  <div class="h-16 w-16 animate-pulse border border-[var(--whois-border)] bg-[var(--whois-surface-2)]"></div>
                  <div class="space-y-3">
                    <div class="h-8 w-64 animate-pulse bg-[var(--whois-surface-2)]"></div>
                    <div class="h-4 w-48 animate-pulse bg-[var(--whois-surface-2)]"></div>
                  </div>
                </div>
                <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  <div class="space-y-8 lg:col-span-2">
                    <div class="h-48 w-full animate-pulse border border-[var(--whois-border)] bg-[var(--whois-surface)]"></div>
                    <div class="h-48 w-full animate-pulse border border-[var(--whois-border)] bg-[var(--whois-surface)]"></div>
                  </div>
                  <div class="h-96 w-full animate-pulse border border-[var(--whois-border)] bg-[var(--whois-surface)]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {:else}
      {@render children()}
    {/if}
  </main>
</section>
