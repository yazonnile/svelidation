<script>
  import Toggle from 'docs/builder/components/toggle.svelte';

  export let model;
  export let disabled = false;
  export let type = 'text';
  export let text;
  export let placeholder = false;

  if (!placeholder) {
    placeholder = '';
  }

  const onClick = () => {
    if (!model.checked) {
      model.checked = true;
    }
  }
</script>


<div
  class="rule"
  class:checked={model.checked}
  class:disabled
  on:click={onClick}
>
  <Toggle bind:checked={model.checked} />

  <span>{text}</span>

  {#if typeof model.value !== 'undefined'}
    {#if Array.isArray(model.value)}
      <input {placeholder} type="number" class="double" disabled={!model.checked} bind:value={model.value[0]} />
      <input {placeholder} type="number" class="double" disabled={!model.checked} bind:value={model.value[1]} />
    {:else if type === 'number'}
      <input {placeholder} type="number" disabled={!model.checked} bind:value={model.value} />
    {:else}
      <input {placeholder} type="text" disabled={!model.checked} bind:value={model.value} />
    {/if}
  {/if}
</div>

<style>
  .rule {
    background: var(--mainColorLight);
    cursor: pointer;
    display: flex;
    flex: 1 0 calc(50% - 10px);
    margin: 0 10px 10px 0;
    min-width: 250px;
    padding: 10px;
    width: calc(50% - 10px);
  }

  .rule.checked {
    cursor: initial;
  }

  .disabled {
    filter: grayscale(100%);
    opacity: .5;
    pointer-events: none;
  }

  .rule span {
    flex: 1;
    margin-left: 10px;
  }

  .rule input {
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

  .rule input:disabled {
    cursor: pointer;
    opacity: .5;
  }

  .rule .double {
    width: 45px;
  }
</style>
