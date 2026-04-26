<script lang="ts">
  import { cn } from "$lib/utils";
  import ModeToggle from "./ModeToggle.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Separator } from "$lib/components/ui/separator";
  import { 
    Send as SendIcon, Plus as PlusIcon, Menu as MenuIcon, X as XIcon,
    Search, Star, History, History as RecentIcon
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
  class="sticky top-0 z-50 flex h-14 w-full flex-col bg-neutral-100 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 md:border-none"
>
  <nav class="flex h-14 w-full items-center justify-end px-4 md:pl-56 md:pr-4">
    <div class="flex items-center space-x-2">
      <!-- Desktop Actions -->
      <div class="hidden items-center md:flex">
        <ModeToggle
          class="inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        />
        
        <div class="flex items-center">
          <div class="h-6 w-[1px] bg-neutral-200 dark:bg-neutral-800 ml-4 mr-3"></div>
          <a
            href="https://github.com/xtrafr/webdna"
            target="_blank"
            rel="noreferrer"
            class="flex items-center space-x-2.5 transition-opacity hover:opacity-80"
          >
            <GithubIcon size={20} class="text-neutral-900 dark:text-white" />
            <span class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Star me!</span>
          </a>
          <div class="h-6 w-[1px] bg-neutral-200 dark:bg-neutral-800 ml-3 mr-3"></div>
        </div>
      </div>

      <!-- New Scan Button (Shared) -->
      <div class="hidden md:flex items-center">
        <Button 
          variant="secondary" 
          size="sm" 
          class="h-9 px-3 gap-1.5 rounded-md bg-neutral-200 text-neutral-900 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 transition-all border border-neutral-300 dark:border-neutral-700"
          href="/"
        >
          <PlusIcon size={14} />
          <span class="text-xs font-bold tracking-tight">New Scan</span>
        </Button>
      </div>

      <!-- Mobile Menu Toggle -->
      <div class="flex items-center gap-2 md:hidden">
        <ModeToggle class="h-9 w-9 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800" />
        <button 
          onclick={() => isMenuOpen = !isMenuOpen}
          class="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white"
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
      class="fixed inset-0 top-14 z-50 bg-neutral-100/80 backdrop-blur-md dark:bg-neutral-950/80 md:hidden"
      onclick={() => isMenuOpen = false}
      transition:fade={{ duration: 200 }}
    >
      <div 
        class="flex flex-col bg-white dark:bg-neutral-900 shadow-xl border-b border-neutral-200 dark:border-neutral-800 px-4 py-6"
        onclick={(e) => e.stopPropagation()}
        transition:slide
      >
        <div class="space-y-1 mb-6">
          {#each links as link}
            <a
              href={link.href}
              onclick={() => isMenuOpen = false}
              class={cn(
                "flex items-center space-x-3 rounded-xl px-3 py-3 text-sm font-bold transition-all",
                page.url.pathname === link.href 
                  ? "bg-[#7bc5e4] text-white" 
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              )}
            >
              <link.icon size={18} />
              <span>{link.name}</span>
            </a>
          {/each}
        </div>

        {#if $history.length > 0}
          <div class="space-y-4">
            <div class="flex items-center gap-2 px-3">
              <Separator class="flex-1" />
              <span class="text-[10px] font-black uppercase tracking-widest text-neutral-400">Recent</span>
              <Separator class="flex-1" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              {#each $history.slice(0, 4) as item}
                <a
                  href="/inspect/{encodeURIComponent(item.domain)}"
                  onclick={() => isMenuOpen = false}
                  class="flex items-center gap-2 rounded-xl border border-neutral-100 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-800/50"
                >
                  <div class="h-6 w-6 overflow-hidden rounded bg-white p-0.5 dark:bg-neutral-900">
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
                  <span class="truncate text-[10px] font-bold text-neutral-600 dark:text-neutral-400">{item.name}</span>
                </a>
              {/each}
            </div>
          </div>
        {/if}

        <Button 
          class="mt-8 w-full bg-[#7bc5e4] hover:bg-[#6ab4d3] text-white border-none shadow-lg shadow-[#7bc5e4]/20 py-6 text-sm font-black uppercase tracking-widest"
          href="/"
          onclick={() => isMenuOpen = false}
        >
          <PlusIcon size={16} class="mr-2" />
          New Inspection
        </Button>
      </div>
    </div>
  {/if}
</header>
