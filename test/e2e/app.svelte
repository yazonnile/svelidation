<script>
  import Validation, { addValidator, BaseType } from './validation/svelte-validation';

  addValidator('email', class extends BaseType {
    typeValidation() {
      return super.typeValidation(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    }
  });

  addValidator('url', class extends BaseType {
    typeValidation() {
      return super.typeValidation(/(https?|ftp|git|svn):\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,63}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i);
    }
  });

  const validation = new Validation();
  const { createForm } = validation;

  const [ loginStore, loginInput ] = validation.createEntry({
    type: 'string',
    minLength: 4,
    maxLength: 10,
    value: 'te'
  });

  const {
    password: [passwordStore, passwordInput],
    email: [emailStore, emailInput],
    age: [ageStore, ageInput],
    age2: [age2Store, age2Input],
    antiBot: [antiBotStore, antiBotInput],
  } = validation.createEntries({
    password: {
      type: 'string',
      minLength: 6,
      maxLength: 12,
      trim: false
    },
    email: {
      type: 'email',
      optional: true,
      value: 19
    },
    age: {
      type: 'number',
      minValue: 16
    },
    age2: {
      type: 'number'
    },
    antiBot: {
      type: 'number',
      equal: 47
    }
  });

  let a = 1;
</script>

<button on:click={() => (a = (a === 2 ? 1 : 2))}>
  CHANGE VIEW
</button>
<hr>
<hr>

<form novalidate action="/" on:submit|preventDefault use:createForm>
  {#if a === 2}
    <div>
      <input type="text" bind:value="{$loginStore.value}" use:loginInput>
      {JSON.stringify({
      type: 'string',
      minLength: 4,
      maxLength: 10,
      initialValue: 'te'
      })} <br>
      {JSON.stringify($loginStore.errors)}
    </div>
<!--    <div>-->
<!--      <input type="password" bind:value="{$passwordStore.value}" use:passwordInput />-->
<!--      {JSON.stringify({-->
<!--      type: 'string',-->
<!--      minLength: 6,-->
<!--      maxLength: 12,-->
<!--      trim: false-->
<!--      })} <br>-->
<!--      {JSON.stringify($passwordStore.errors)}-->
<!--    </div>-->
  {:else}
    <div>
      <input type="email" bind:value="{$emailStore.value}" use:emailInput />
      {JSON.stringify({
      type: 'email',
      optional: true
      })} <br>
      {JSON.stringify($emailStore.errors)}
    </div>
  {/if}
<!--    <div>-->
<!--      <input type="text" bind:value="{$ageStore.value}" use:ageInput />-->
<!--      {JSON.stringify({-->
<!--        type: 'number',-->
<!--        minValue: 16-->
<!--      })} <br>-->
<!--      {JSON.stringify($ageStore.errors)}-->
<!--    </div>-->
<!--    <div>-->
<!--      <input type="text" bind:value="{$age2Store.value}" use:age2Input />-->
<!--      {JSON.stringify({-->
<!--        type: 'number'-->
<!--      })} <br>-->
<!--      {JSON.stringify($age2Store.errors)}-->
<!--    </div>-->
<!--    <div>-->
<!--      <input type="text" bind:value="{$antiBotStore.value}" use:antiBotInput />-->
<!--      {JSON.stringify({-->
<!--        type: 'number',-->
<!--        equalValue: 47-->
<!--      })} <br>-->
<!--      {JSON.stringify($antiBotStore.errors)}-->
<!--    </div>-->

  <button type="submit">Submit</button>
</form>

<style>
  div {
    margin-bottom: 20px;
  }
</style>
