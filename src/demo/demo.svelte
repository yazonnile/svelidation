<script>
  export let defaultSettings = false;
  export let options = null;
  export let title = 'Default';

  import Validation from 'lib/lib';

  const validation = new Validation(options);
  const { createForm } = validation;

  const [ loginStore, loginInput ] = validation.createEntry({
    type: 'string',
    minLength: 5,
    maxLength: 15
  });

  const [ emailStore, emailInput ] = validation.createEntry({
    type: 'email'
  });

  const [ ageStore, ageInput ] = validation.createEntry({
    type: 'number',
    min: 18
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
  {@html `<pre><code>${defaultSettings ? '// default settings\n' : ''}new Validation(${JSON.stringify(options, null, '  ')});</code></pre>`}
  <label>
    Login
    <input type="text" use:loginInput bind:value={$loginStore.value} />
    {#if $loginStore.errors.includes('minLength')}
      <p class="error">Login should be at least 3 symbols long</p>
    {/if}
    {#if $loginStore.errors.includes('maxLength')}
      <p class="error">Login should be not longer than 15 symbols</p>
    {/if}
  </label>
  <label>
    Email
    <input type="email" use:emailInput bind:value={$emailStore.value} />
    {#if $emailStore.errors.includes('typeCheck')}
      <p class="error">Email should be correct</p>
    {/if}
  </label>
  <label>
    Number
    <input type="text" use:ageInput bind:value={$ageStore.value} />
    {#if $ageStore.errors.includes('typeCheck')}
      <p class="error">Please, fill the number!</p>
    {/if}
    {#if $ageStore.errors.includes('min')}
      <p class="error">For boomers only!</p>
    {/if}
  </label>

  <button type="submit">Submit</button>
  {#if options && options.clearOn && options.clearOn.indexOf('reset') > -1}
    <button type="reset">Reset</button>
  {/if}
</form>

<style>
  div {
    margin-bottom: 20px;
  }
</style>
