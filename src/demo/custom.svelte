<script>
  import Validation, { StringType, BaseType, addValidator } from 'lib/lib';

  addValidator('newTypeByRule', class extends StringType {
    newTypeParamRule() {
      return this.getValue() === this.params.newTypeParam;
    }
  });

  addValidator('newTypeByType', class extends BaseType {
    typeValidation() {
      return super.typeValidation(/AAA/);
    }
  });

  const validation = new Validation();
  const { createForm } = validation;

  const [ firstStore, firstInput ] = validation.createEntry({
    type: 'newTypeByRule',
    newTypeParam: 'AAA'
  });

  const [ secondStore, secondInput ] = validation.createEntry({
    type: 'newTypeByType'
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
  <h1>Custom example</h1>
  <label>
    Type 'AAA' (by rule)
    <input type="email" use:firstInput bind:value={$firstStore.value} />
    {#if $firstStore.errors.includes('newTypeParam')}
      <p class="error">OMG, you've messed up</p>
    {/if}
  </label>
  <label>
    Type 'AAA' (by type)
    <input type="email" use:secondInput bind:value={$secondStore.value} />
    {#if $secondStore.errors.includes('type')}
      <p class="error">OMG, you've messed up</p>
    {/if}
  </label>
  <button type="submit">submit</button>
</form>
