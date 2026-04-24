<script lang="ts">
  import { Separator as SeparatorPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";

  let {
    class: className,
    orientation = "horizontal",
    ...restProps
  }: SeparatorPrimitive.RootProps = $props();
</script>

<SeparatorPrimitive.Root
  class={cn(
    "shrink-0 bg-neutral-300 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px dark:bg-neutral-800",
    className,
  )}
  {orientation}
  {...restProps}
/>
