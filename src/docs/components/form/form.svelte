<script>
  export let createForm;
  export let noButtons = false;

  import Row from 'docs/components/row/row.svelte';
</script>

<form novalidate use:createForm on:submit|preventDefault>
  <slot />
  {#if !noButtons}
    <Row buttons />
  {/if}
</form>

<style>
  form {
    border: 5px solid var(--mainColorLight);
    border-radius: 3px;
    margin-bottom: 20px;
    padding: 10px;
  }
</style>
