<script lang="ts">
  import { cn } from "$lib/utils";
  import { badgeVariants, type BadgeVariant, type BadgeSize } from "./variants";

  interface Props {
    class?: string;
    variant?: BadgeVariant;
    size?: BadgeSize;
    href?: string;
    children?: import("svelte").Snippet;
    [key: string]: any;
  }

  let {
    class: className,
    variant = "default",
    size = "sm",
    href = undefined,
    children,
    ...restProps
  }: Props = $props();
</script>

<svelte:element
  this={href ? "a" : "span"}
  {href}
  class={cn(badgeVariants({ variant, size }), className)}
  {...restProps}
>
  {@render children?.()}
</svelte:element>
