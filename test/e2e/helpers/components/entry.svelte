<script>
  export let store;
  export let input = () => {};
  export let inputOpts = {};
  export let type = 'text';
</script>

<label>
  <slot>Label</slot>
  {#if type === 'email'}
    <input type="email" use:input={inputOpts} bind:value={$store.value} />
  {:else if type === 'number'}
    <input type="number" use:input={inputOpts} bind:value={$store.value} />
  {:else if type === 'boolean'}
    <input type="checkbox" use:input={inputOpts} bind:checked={$store.value} />
  {:else}
    <input type="text" use:input={inputOpts} bind:value={$store.value} />
  {/if}
  {#each $store.errors as error}
    <p class="error">{error}</p>
  {/each}
</label>
