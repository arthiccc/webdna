<script lang="ts">
  import { cn } from "$lib/utils";
  import { Button } from "$lib/components/ui/button";
  import { Separator } from "$lib/components/ui/separator";
  import { 
    Send as SendIcon, Plus as PlusIcon, Menu as MenuIcon, X as XIcon,
    Search, Star, History, History as RecentIcon, Layers as LayersIcon
  } from "@lucide/svelte";
  import GithubIcon from "$lib/components/logos/Github.svelte";
  import { history } from "$lib/stores/appState";
  import { slide, fade } from "svelte/transition";
  import { page } from "$app/state";

  let isMenuOpen = $state(false);

  const links = [
    { name: "Inspect", icon: Search, href: "/" },
    { name: "Favorites", icon: Star, href: "/favorites" },
    { name: "History", icon: History, href: "/history" },
  ];
</script>

<header
  class="sticky top-0 z-50 flex h-14 w-full flex-col bg-[var(--whois-sidebar)] border-b border-[var(--whois-border)] md:border-none"
>
  <nav class="flex h-14 w-full items-center justify-end px-4 md:pl-56 md:pr-6">
    <div class="flex items-center space-x-2 translate-y-1.5">
      <!-- Desktop Actions -->
      <div class="hidden items-center md:flex">
        
        <div class="flex items-center">
          <div class="h-4 w-[1px] bg-[var(--whois-border)] ml-2 mr-2"></div>
          <a
            href="https://github.com/xtrafr/webdna"
            target="_blank"
            rel="noreferrer"
            class="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--whois-text-muted)] hover:text-[var(--whois-accent)] transition-all"
          >
            <GithubIcon size={16} class="text-current" />
            <span>Repository</span>
          </a>
          <div class="h-4 w-[1px] bg-[var(--whois-border)] ml-2 mr-2"></div>
        </div>
      </div>

      <!-- New Scan Button (Shared) -->
      <div class="hidden md:flex items-center">
        <a 
          class="h-8 px-4 border border-[var(--whois-accent)] bg-[var(--whois-accent-dim)] text-[var(--whois-accent)] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[var(--whois-accent)] hover:text-[var(--whois-accent-text)] transition-all"
          href="/"
        >
          <PlusIcon size={12} />
          <span>New_Scan</span>
        </a>
      </div>

      <!-- Mobile Menu Toggle -->
      <div class="flex items-center gap-2 md:hidden">
        <button 
          onclick={() => isMenuOpen = !isMenuOpen}
          class="flex h-9 w-9 items-center justify-center border border-[var(--whois-border)] bg-[var(--whois-surface)] text-[var(--whois-text)]"
        >
          {#if isMenuOpen}
            <XIcon size={18} />
          {:else}
            <MenuIcon size={18} />
          {/if}
        </button>
      </div>
    </div>
  </nav>

  <!-- Mobile Menu Expandable -->
  {#if isMenuOpen}
    <div 
      class="fixed inset-0 top-14 z-50 bg-black/80 backdrop-blur-sm md:hidden"
      onclick={() => isMenuOpen = false}
      transition:fade={{ duration: 150 }}
    >
      <div 
        class="flex flex-col bg-[var(--whois-sidebar)] border-b border-[var(--whois-border)] px-4 py-8"
        onclick={(e) => e.stopPropagation()}
        transition:slide
      >
        <div class="flex flex-col space-y-2 mb-8">
          {#each links as link}
            <a
              href={link.href}
              onclick={() => isMenuOpen = false}
              class={cn(
                "flex items-center space-x-4 border border-transparent px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                page.url.pathname === link.href 
                  ? "bg-[var(--whois-accent-dim)] text-[var(--whois-accent)] border-[var(--whois-border)]" 
                  : "text-[var(--whois-text-muted)] hover:text-[var(--whois-text)] hover:bg-[var(--whois-surface)]"
              )}
            >
              <link.icon size={16} />
              <span>{link.name}</span>
            </a>
          {/each}
        </div>

        {#if $history.length > 0}
          <div class="space-y-4">
            <div class="flex items-center gap-2 px-2">
              <div class="h-px bg-[var(--whois-border)] flex-1"></div>
              <span class="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--whois-text-dim)] px-2">Recents</span>
              <div class="h-px bg-[var(--whois-border)] flex-1"></div>
            </div>
            <div class="grid grid-cols-1 gap-2">
              {#each $history.slice(0, 5) as item}
                <a
                  href="/inspect/{encodeURIComponent(item.domain)}"
                  onclick={() => isMenuOpen = false}
                  class="flex items-center gap-3 border border-[var(--whois-border)] bg-[var(--whois-surface)] p-3 hover:border-[var(--whois-accent)] transition-all"
                >
                  <div class="h-5 w-5 border border-[var(--whois-border)] bg-black p-0.5">
                    <img 
                      src={item.favicon} 
                      alt="" 
                      class="h-full w-full object-contain"
                      onerror={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.src.includes('google.com')) {
                          target.src = `https://www.google.com/s2/favicons?domain=${item.domain}&sz=64`;
                        }
                      }}
                    />
                  </div>
                  <span class="truncate text-[10px] font-bold text-[var(--whois-text-muted)] uppercase tracking-widest">{item.name}</span>
                </a>
              {/each}
            </div>
          </div>
        {/if}

        <a 
          class="mt-8 flex h-12 w-full items-center justify-center border border-[var(--whois-accent)] bg-[var(--whois-accent)] text-[var(--whois-accent-text)] text-[10px] font-black uppercase tracking-[0.3em] hover:brightness-110 transition-all shadow-xl shadow-[var(--whois-accent)]/10"
          href="/"
          onclick={() => isMenuOpen = false}
        >
          <PlusIcon size={14} class="mr-2" />
          Initialize_Scan
        </a>
      </div>
    </div>
  {/if}
</header>
