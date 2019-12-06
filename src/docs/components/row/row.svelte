<script>
  export let labelText = '';
  export let buttons = false;
</script>

<div class="row">
  {#if !buttons}
    <label>
      <span class="label">{labelText}</span>
      <slot />
    </label>
  {:else}
    <button type="submit">validate</button>
  {/if}
</div>

<style>
  .row {
    margin-bottom: 10px;
  }

  .row:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
  }

  button {
    background: none;
    border: 1px solid var(--mainColorLight);
    border-radius: 3px;
    cursor: pointer;
    height: 40px;
    font-size: inherit;
    margin-right: 5px;
    line-height: 28px;
    outline: 0;
    padding: 5px 10px;
    text-transform: uppercase;
  }

  button:hover {
    border-color: var(--mainColor);
  }
</style>
