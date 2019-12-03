<script>
  export let options = null;
  export let title = 'Default';

  import Validation from 'lib/lib';

  const validation = new Validation(options);
  const { createForm } = validation;

  const [ radioStore, radioInput ] = validation.createEntry({
    type: 'number',
    required: true,
    // value: 0
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
    <p>Check your experience (years)</p>
    <label><input type="radio" use:radioInput bind:group={$radioStore.value} value={0}> less than 1</label>
    <label><input type="radio" use:radioInput bind:group={$radioStore.value} value={1}> 1 .. 3</label>
    <label><input type="radio" use:radioInput bind:group={$radioStore.value} value={2}> more than 3</label>
    {#if $radioStore.errors.length}
      <p class="error">Please select something</p>
    {/if}
  </div>

  <button type="submit">Submit</button>
  {#if options && options.clearOn && options.clearOn.indexOf('reset') > -1}
    <button type="reset">Reset</button>
  {/if}
</form>
