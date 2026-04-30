<script lang="ts">
  import { cn } from "$lib/utils";
  import { onMount } from "svelte";
	import { Search as SearchIcon, Loader2 as Loader2Icon } from "@lucide/svelte";
  import { goto } from "$app/navigation";

  let { class: className } = $props<{ class?: string }>();
  let url = $state("");
  let isLoading = $state(false);
  let inputElement: HTMLInputElement;

  const handleSubmit = async (e?: Event) => {
    e?.preventDefault();
    if (!url || isLoading) return;
    
    isLoading = true;
    try {
      await goto(`/inspect/${encodeURIComponent(url)}`);
    } catch (err) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      inputElement?.focus();
    }
  };

  onMount(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });
</script>

<form 
  onsubmit={handleSubmit}
  class={cn("relative w-full px-4 md:px-0", className)}
>
  <div class="relative flex items-center">
    <div class="pointer-events-none absolute left-3 text-neutral-400 dark:text-neutral-500">
      {#if isLoading}
        <Loader2Icon size={20} class="animate-spin" />
      {:else}
        <SearchIcon size={20} strokeWidth={2} />
      {/if}
    </div>
    
    <input
      bind:this={inputElement}
      type="text"
      bind:value={url}
      placeholder="Paste a website URL..."
      class={cn(
        "h-11 w-full rounded-md border border-neutral-200 bg-white pl-10 pr-24 text-base shadow-sm outline-none transition-all",
        "focus:border-neutral-400 focus:ring-0",
        "dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:shadow-none dark:focus:border-neutral-600"
      )}
    />
    
    {#if !url && !isLoading}
      <div class="absolute right-3 flex items-center space-x-1 text-xs text-neutral-400">
        <span class="rounded border border-neutral-200 px-1 dark:border-neutral-800">⌘</span>
        <span class="rounded border border-neutral-200 px-1 dark:border-neutral-800">K</span>
      </div>
    {/if}

    {#if url && !isLoading}
      <button
        type="submit"
        class="absolute right-1.5 h-8 rounded-md bg-neutral-900 px-3 text-xs font-medium text-white transition-all hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
      >
        Inspect
      </button>
    {/if}
  </div>
</form>
