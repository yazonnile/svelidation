<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/ui/error.svelte';
  import Row from 'docs/examples/components/row.svelte';
  import Form from 'docs/examples/components/form.svelte';
  import Code from 'docs/ui/code.svelte';
  import Button from 'docs/ui/button.svelte';

  const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
  const [ errorsRequired, valueRequired, inputRequired ] = createEntry({
    type: 'email', required: true
  });
  const [ errors, value, input ] = createEntry({
    type: 'email'
  });

  const jsCode = `const [ errorsRequired, valueRequired, inputRequired ] = createEntry({
  type: 'email', required: true
});
const [ errors, value, input ] = createEntry({
  type: 'email'
});`;

  const htmlCode = `<input use:inputRequired bind:value={$valueRequired} type="email" />
{#if $errors.includes('typeCheck')}Use valid email{/if}
{#if $errors.includes('required')}This field is required{/if}

<input use:input bind:value={$value} type="email" />
{#if $errors.includes('typeCheck')}Use valid email{/if}`;
</script>

<Form {createForm} title="required" rule>
  <Code code={jsCode} />
  <Code code={htmlCode} />
  <Row labelText="Type your email (required)">
    <input use:inputRequired bind:value={$valueRequired} class="input-text" type="email" placeholder="type: 'email', required: true" />
    <Error errors={errorsRequired} errorCode="typeCheck" errorText="Use valid email" />
    <Error errors={errorsRequired} errorCode="required" />
  </Row>
  <Row labelText="Type your email (optional)">
    <input use:input bind:value={$value} class="input-text" type="email" placeholder="type: 'email'" />
    <Error {errors} errorCode="typeCheck" errorText="Use valid email" />
  </Row>
  <Button type="submit" />
</Form>
