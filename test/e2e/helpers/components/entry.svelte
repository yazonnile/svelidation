<script>
  export let store;
  export let input;
  export let type = 'text';
</script>

<label>
  <slot>Label</slot>
  {#if type === 'email'}
    <input type="email" use:input bind:value={$store.value} />
  {:else if type === 'number'}
    <input type="number" use:input bind:value={$store.value} />
  {:else}
    <input type="text" use:input bind:value={$store.value} />
  {/if}
  {#each $store.errors as error}
    <p class="error">{error}</p>
  {/each}
</label>
