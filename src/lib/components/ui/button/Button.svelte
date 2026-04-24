<script lang="ts">
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";
  import { buttonVariants, type ButtonVariant, type ButtonSize } from "./variants";

  interface Props {
    class?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    href?: string;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    children?: import("svelte").Snippet;
    [key: string]: any;
  }

  let {
    class: className,
    variant = "default",
    size = "default",
    href = undefined,
    type = "button",
    disabled,
    children,
    ...restProps
  }: Props = $props();
</script>

{#if href}
  <a
    class={cn(buttonVariants({ variant, size }), className)}
    href={disabled ? undefined : href}
    aria-disabled={disabled}
    role={disabled ? "link" : undefined}
    tabindex={disabled ? -1 : undefined}
    {...restProps}
  >
    {@render children?.()}
  </a>
{:else}
  <button
    class={cn(buttonVariants({ variant, size }), className)}
    {type}
    {disabled}
    {...restProps}
  >
    {@render children?.()}
  </button>
{/if}
