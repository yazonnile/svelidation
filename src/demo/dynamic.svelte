<script>
  import createValidation from 'lib/lib';

  const { createForm, createEntry } = createValidation({
    validateOn: [],
    presence: 'required'
  });

  const [ loginStore, loginInput ] = createEntry({
    type: 'string',
    minLength: 3,
    maxLength: 15
  });

  const [ emailStore, emailInput ] = createEntry({
    type: 'email',
  });

  const [ email2Store, email2Input ] = createEntry({
    type: 'email'
  });

  const [ ageStore, ageInput ] = createEntry({
    type: 'number',
    min: 18
  });

  let step = 1;
  let success = false;
  const onSuccess = () => {
    if (step === 3) {
      success = true;
    } else {
      step++;
    }
  };
  const onFail = () => { success = false; };
</script>

<form
  novalidate
  use:createForm={{ onSuccess, onFail }}
  on:submit|preventDefault
  class:success
>
  <h1>Dynamic example</h1>
  <div class="row">
    <button type="button" class:button-active={step === 1} on:click={() => (step = 1)}>Step 1</button>
    <button type="button" class:button-active={step === 2} on:click={() => (step = 2)}>Step 2</button>
    <button type="button" class:button-active={step === 3} on:click={() => (step = 3)}>Step 3</button>
  </div>
  {#if step === 1}
    <label>
      Login STEP 1
      <input type="text" use:loginInput bind:value={$loginStore.value} />
      {#if $loginStore.errors.includes('minLength')}
        <p class="error">Login should be at least 3 symbols long</p>
      {/if}
      {#if $loginStore.errors.includes('maxLength')}
        <p class="error">Login should be not longer than 15 symbols</p>
      {/if}
    </label>
  {:else if step === 2}
    <label>
      Email STEP 2
      <input type="email" use:emailInput bind:value={$emailStore.value} />
      {#if $emailStore.errors.includes('typeCheck')}
        <p class="error">Email should be correct</p>
      {/if}
    </label>
    <label>
      Email STEP 2
      <input type="email" use:email2Input bind:value={$email2Store.value} />
      {#if $email2Store.errors.includes('typeCheck')}
        <p class="error">Email should be correct</p>
      {/if}
    </label>
  {:else if step === 3}
    <label>
      Number STEP 3
      <input type="number" use:ageInput bind:value={$ageStore.value} />
      {#if $ageStore.errors.includes('min')}
        <p class="error">For boomers only!</p>
      {/if}
      {#if $ageStore.errors.includes('typeCheck')}
        <p class="error">Number plz!</p>
      {/if}
    </label>
  {/if}
  <button type="submit">{step < 3 ? 'NEXT' : 'submit'}</button>
</form>
