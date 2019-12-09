<script>
  export let n;
</script>

{#if n%2}
  <slot />
{:else}
  <slot />
{/if}
