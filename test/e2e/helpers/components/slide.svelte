<script>
  export let id;
  export let activeId;
</script>

{#if id === activeId}
  <slot></slot>
{/if}

<button
  type="button"
  {id}
  on:click={() => (activeId = id)}
  class="slide-button"
  class:button-active={activeId === id}
>{id}</button>
