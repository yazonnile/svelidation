<script>
  export let entry;
  export let inputOpts = {};
  export let type = 'text';
  export let noInput = false;

  import { writable } from 'svelte/store';

  let [ errors, value, input = () => {} ] = entry;

  if (noInput) {
    input = () => {};
    value = writable('');
  }
</script>

<label>
  <slot>Label</slot>
  {#if type === 'email'}
    <input type="email" use:input={inputOpts} bind:value={$value} />
  {:else if type === 'number'}
    <input type="number" use:input={inputOpts} bind:value={$value} />
  {:else if type === 'boolean'}
    <input type="checkbox" use:input={inputOpts} bind:checked={$value} />
  {:else}
    <input type="text" use:input={inputOpts} bind:value={$value} />
  {/if}
  {#each $errors as error}
    <p class="error">{error}</p>
  {/each}
</label>
