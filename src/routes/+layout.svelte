<script lang="ts">
  import "../app.css";
  import { ModeWatcher } from "mode-watcher";
  import { Toaster } from "svelte-sonner";
  import { dev } from '$app/environment';
  import Header from "$lib/components/layout/Header.svelte";
  import Sidebar from "$lib/components/layout/Sidebar.svelte";

  let { children, data } = $props();
</script>

<svelte:head>
  {#if !dev && !data.isBot}
    <script defer src="/stats/script.js" data-website-id="0a8cf48d-1fe0-45ad-8ffb-326c95da9e3f" data-host-url="/stats"></script>
  {/if}
</svelte:head>

<ModeWatcher />
<Toaster 
  position="bottom-right" 
  theme="system" 
  richColors 
  closeButton
  visibleToasts={1}
  toastOptions={{
    class: 'group !bg-white dark:!bg-neutral-900 !border-neutral-200 dark:!border-neutral-800 !shadow-[0_20px_50px_rgba(0,0,0,0.1)] !rounded-[1.25rem] !px-4 !py-3 !font-medium !text-sm',
    descriptionClass: '!text-neutral-500 !text-xs'
  }}
/>

<Header />
<section>
  <Sidebar />
  <main class="px-2 md:mr-4 md:ml-56 md:px-0">
    {@render children()}
  </main>
</section>
