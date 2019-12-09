<script>
  import Toggle from 'docs/builder/components/toggle.svelte';

  export let model;
  export let disabled = false;
  export let text;
  export let id;
</script>


<div
  class="option"
  class:checked={model}
  class:disabled
>
  {#if typeof model === 'boolean'}
    <Toggle bind:checked={model} {id} />
  {/if}

  <label for={id}>{text}</label>

  {#if typeof model !== 'boolean'}
    <input type="number" bind:value={model} min="0" max="2" />
  {/if}
</div>

<style>
  .option {
    background: var(--mainColorLight);
    cursor: pointer;
    display: flex;
    margin-bottom: 10px;
    min-width: 250px;
    padding: 10px;
  }

  .disabled {
    cursor: initial;
    filter: grayscale(100%);
    opacity: .5;
    pointer-events: none;
  }

  .option label {
    cursor: pointer;
    flex: 1;
    margin-left: 10px;
  }

  .option input {
    border: 1px solid var(--grey);
    border-radius: 3px;
    font-size: 14px;
    height: 20px;
    line-height: 18px;
    margin-left: 10px;
    outline: 0;
    padding: 0 3px;
    text-align: right;
    width: 100px;
  }
</style>
