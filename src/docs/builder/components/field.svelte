<script>
  export let createEntry;
  export let validateValueStore;
  export let params;
  export let id;

  import Error from 'docs/ui/error.svelte';
  import Code from 'docs/ui/code.svelte';
  import { getEntryHTML, getEntryJS, getEntryErrors } from 'docs/builder/lib/get-code/get-code';

  const { type } = params;
  const [ errors, value, input ] = createEntry(params);
  const validateRow = () => {
    validateValueStore(value);
  };
</script>

<div class="field">
  <div class="html">
    <div class="buttons">
      <slot />
      <button on:click={validateRow} type="button">validate field</button>
    </div>
    {#if type === 'boolean'}
      <label><input bind:checked={$value} use:input class="input-choice" type="checkbox" /> Are you agree?</label>
    {:else if type === 'array'}
      <label><input bind:group={$value} use:input class="input-choice" type="checkbox" value="Lorem" /> Lorem</label>
      <label><input bind:group={$value} use:input class="input-choice" type="checkbox" value="ipsum" /> Ipsum</label>
      <label><input bind:group={$value} use:input class="input-choice" type="checkbox" value="dolor" /> Dolor?</label>
    {:else}
      {#if type === 'number'}
        <input type="number" bind:value={$value} use:input class="input-text" />
      {:else if type === 'email'}
        <input type="email" bind:value={$value} use:input class="input-text" />
      {:else}
        <input type="text" bind:value={$value} use:input class="input-text" />
      {/if}
    {/if}

    {#each $errors as errorCode}
      <Error {errors} {errorCode} fromLoop />
    {/each}
  </div>
  <div class="code">
    <Code code={getEntryJS(id, params) + '\n\n' + getEntryHTML(id,  params) + '\n' + getEntryErrors(id, params)} builderMode />
  </div>
</div>

<style>
  .field {
    display: flex;
    position: relative;
  }

  .html {
    border-right: 1px dashed var(--grey);
    padding: 10px;
    width: 50%;
  }

  .code {
    width: 50%;
  }

  label {
    cursor: pointer;
    display: block;
  }

  label + label {
    margin-top: 5px;
  }

  .buttons {
    margin: -10px 0 10px -10px;
  }
</style>
