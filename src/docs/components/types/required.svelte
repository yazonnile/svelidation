<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/components/error/error.svelte';
  import Row from 'docs/components/row/row.svelte';
  import Form from 'docs/components/form/form.svelte';
  import Code from 'docs/components/code/code.svelte';

  const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
  const [ errorsRequired, valueRequired, inputRequired ] = createEntry({
    type: 'email', required: true
  });
  const [ errors, value, input ] = createEntry({
    type: 'email'
  });
</script>

<Form {createForm}>
  <h1>required</h1>
  <Code html={`const [ errorsRequired, valueRequired, inputRequired ] = createEntry({
  type: 'email', required: true
});
const [ errors, value, input ] = createEntry({
  type: 'email'
});`} />
  <Code html={`&lt;input use:inputRequired bind:value={$valueRequired} type="email" />
{#if $errors.includes('typeCheck')}Use valid email{/if}
{#if $errors.includes('required')}This field is required{/if}

&lt;input use:input bind:value={$value} type="email" />
{#if $errors.includes('typeCheck')}Use valid email{/if}`} />
  <Row labelText="Type your email (required)">
    <input use:inputRequired bind:value={$valueRequired} class="input-text" type="email" />
    <Error errors={errorsRequired} errorCode="typeCheck" errorText="Use valid email" />
    <Error errors={errorsRequired} errorCode="required" />
  </Row>
  <Row labelText="Type your email (optional)">
    <input use:input bind:value={$value} class="input-text" type="email" />
    <Error {errors} errorCode="typeCheck" errorText="Use valid email" />
  </Row>
</Form>
