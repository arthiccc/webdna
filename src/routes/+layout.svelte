<script lang="ts">
  import "../app.css";
  import { ModeWatcher } from "mode-watcher";
  import { Toaster } from "svelte-sonner";
  import Header from "$lib/components/layout/Header.svelte";
  import Sidebar from "$lib/components/layout/Sidebar.svelte";

  let { children } = $props();
</script>

<ModeWatcher />
<Toaster 
  position="bottom-right" 
  theme="inherit" 
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
