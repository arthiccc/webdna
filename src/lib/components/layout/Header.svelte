<script lang="ts">
  import { cn } from "$lib/utils";
  import ModeToggle from "./ModeToggle.svelte";
  import HomeLink from "./HomeLink.svelte";
  import { Separator } from "$lib/components/ui/separator";
  import { Button } from "$lib/components/ui/button";
  import { Send as SendIcon, Plus as PlusIcon } from "@lucide/svelte";
  import GithubIcon from "$lib/components/logos/Github.svelte";
</script>

<header
  class="sticky top-0 z-40 flex h-14 w-full items-center justify-center bg-neutral-100 px-2 md:pl-56 md:pr-4 dark:bg-neutral-950"
>
  <nav class="flex h-full w-full items-center justify-end">
    <div class="flex items-center space-x-0">
      <!-- Title is in Sidebar -->
    </div>

    <div class="flex items-center space-x-0">
      <div class="hidden items-center md:flex">
        <ModeToggle
          class="inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        />
        
        <div class="flex items-center">
          <div class="h-6 w-[1px] bg-neutral-200 dark:bg-neutral-800 ml-4 mr-3"></div>
          <a
            href="https://github.com/xtrafr/siteglow"
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

      <div class="hidden items-center md:flex">
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
    </div>
  </nav>
</header>
