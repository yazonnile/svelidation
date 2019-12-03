<script>
  export let options = null;
  export let title = 'Default';

  import Validation from 'lib/lib';

  const validation = new Validation(options);
  const { createForm } = validation;

  const [ arrayStore, arrayInput ] = validation.createEntry({
    type: 'array',
    min: 2,
    value: []
  });

  let success = false;
  const onSuccess = () => { success = true; };
  const onFail = () => { success = false; };
</script>

<form
  novalidate
  use:createForm={{ onSuccess, onFail }}
  on:submit|preventDefault
  class:success
>
  <h1>{@html title}</h1>
  <div class="label">
    <p>Check your skills</p>
    <label><input type="checkbox" use:arrayInput bind:group={$arrayStore.value} value={0}>Sport</label>
    <label><input type="checkbox" use:arrayInput bind:group={$arrayStore.value} value={1}>History</label>
    <label><input type="checkbox" use:arrayInput bind:group={$arrayStore.value} value={2}>Politics</label>
    {#if $arrayStore.errors.length}
      <p class="error">Please select at least 2</p>
    {/if}
  </div>

  <button type="submit">Submit</button>
  {#if options && options.clearOn && options.clearOn.indexOf('reset') > -1}
    <button type="reset">Reset</button>
  {/if}
</form>
