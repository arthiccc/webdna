<script lang="ts">
  import { favorites } from '$lib/stores/appState';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Globe as GlobeIcon, Star as StarIcon } from "@lucide/svelte";

  let searchQuery = $state("");

  const filteredFavorites = $derived(
    $favorites.filter(r => {
      return r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             r.domain.toLowerCase().includes(searchQuery.toLowerCase());
    })
  );
</script>

<div class="mt-2 flex flex-col space-y-2 px-2">
  <div class="p-px">
    <div class="overflow-hidden rounded-md border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900/40">
      <div class="flex flex-col min-h-[calc(100vh-8rem)]">
        
        <!-- Page Header -->
        <div class="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <div class="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400">
            <StarIcon size={18} strokeWidth={1.5} />
            <p class="text-sm">
              <span class="font-mono">Favorites</span>
              <span>Library</span>
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <Badge variant="outline" class="font-mono text-[10px] uppercase tracking-wider">v1.0.0</Badge>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div class="mb-12">
            <h1 class="text-4xl font-bold tracking-tight dark:text-white">Favorites</h1>
            <p class="mt-2 text-neutral-500 dark:text-neutral-400">Your curated collection of web inspiration.</p>
          </div>

          {#if $favorites.length === 0}
            <div class="flex flex-col items-center justify-center py-24 text-center">
              <div class="mb-4 rounded-full bg-neutral-100 p-6 dark:bg-neutral-800">
                <StarIcon size={40} class="text-neutral-400" />
              </div>
              <h2 class="text-xl font-bold dark:text-white">No favorites yet</h2>
              <p class="mt-2 text-neutral-500">Star your favorite websites while inspecting them to see them here.</p>
              <Button href="/" class="mt-8">Start Inspecting</Button>
            </div>
          {:else}
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {#each filteredFavorites as report}
                <a 
                  href="/inspect/{encodeURIComponent(report.domain)}"
                  class="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:border-neutral-300 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700"
                >
                  <div class="relative aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    {#if report.ogImage}
                      <img src={report.ogImage} alt={report.name} class="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    {:else}
                      <div class="flex h-full w-full items-center justify-center text-neutral-400">
                        <GlobeIcon size={40} strokeWidth={1} />
                      </div>
                    {/if}
                  </div>
                  
                  <div class="flex flex-1 flex-col p-5">
                    <div class="mb-2 flex items-center gap-3">
                      <div class="h-8 w-8 overflow-hidden rounded-lg border border-neutral-100 bg-white p-1 dark:border-neutral-800">
                        <img src={report.favicon} alt="" class="h-full w-full object-contain" />
                      </div>
                      <h3 class="font-bold tracking-tight dark:text-white">{report.name}</h3>
                    </div>
                    
                    <p class="mb-4 line-clamp-2 flex-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {report.description}
                    </p>
                  </div>
                </a>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
