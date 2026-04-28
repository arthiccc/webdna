<script lang="ts">
  import { cn } from "$lib/utils";
  import { onMount } from "svelte";
  import { Search as SearchIcon, ArrowRight as ArrowRightIcon, Loader2 as Loader2Icon } from "@lucide/svelte";
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
    <div class="pointer-events-none absolute left-3 text-[var(--whois-text-muted)]">
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
        "h-11 w-full rounded-md border border-[var(--whois-border)] bg-[var(--whois-surface)] pl-10 pr-24 text-base text-[var(--whois-text)] shadow-sm outline-none transition-all",
        "focus:border-[var(--whois-accent)] focus:ring-0"
      )}
    />
    
    {#if !url && !isLoading}
      <div class="absolute right-3 flex items-center space-x-1 text-xs text-[var(--whois-text-muted)]">
        <span class="rounded border border-[var(--whois-border)] px-1">⌘</span>
        <span class="rounded border border-[var(--whois-border)] px-1">K</span>
      </div>
    {/if}

    {#if url && !isLoading}
      <button
        type="submit"
        class="absolute right-1.5 h-8 rounded-md bg-[var(--whois-accent)] px-3 text-xs font-medium text-[var(--whois-accent-text)] transition-all hover:brightness-110"
      >
        Inspect
      </button>
    {/if}
  </div>
</form>