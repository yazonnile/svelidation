<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/components/error/error.svelte';
  import Row from 'docs/components/row/row.svelte';
  import Form from 'docs/components/form/form.svelte';
  import Code from 'docs/components/code/code.svelte';

  const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
  const [ errors, value, input ] = createEntry({
    type: 'email', required: true
  });
</script>

<Form {createForm}>
  <h1>email</h1>
  <Code html={`const [ errors, value, input ] = createEntry({
  type: 'email', required: true
});`} />
  <Code html={`&lt;input use:input bind:value={$value} />
{#if $errors.includes('typeCheck')}Use valid email{/if}`} />
  <Row labelText="Type your email">
    <input use:input bind:value={$value} class="input-text" type="email" />
    <Error {errors} errorCode="typeCheck" errorText="Use valid email" />
  </Row>
</Form>
