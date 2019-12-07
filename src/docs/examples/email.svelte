<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/ui/error.svelte';
  import Row from 'docs/examples/components/row.svelte';
  import Form from 'docs/examples/components/form.svelte';
  import Code from 'docs/ui/code.svelte';
  import Button from 'docs/ui/button.svelte';

  const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
  const [ errors, value, input ] = createEntry({
    type: 'email', required: true
  });

  const htmlCode = `const [ errors, value, input ] = createEntry({
  type: 'email', required: true
});`;

  const jsCode = `<input use:input bind:value={$value} />
{#if $errors.includes('typeCheck')}Use valid email{/if}`;
</script>

<Form {createForm} title="email" type>
  <Code code={htmlCode} />
  <Code code={jsCode} />
  <Row labelText="Type your email">
    <input use:input bind:value={$value} class="input-text" type="email" placeholder="type: 'email', required: true" />
    <Error {errors} errorCode="typeCheck" errorText="Use valid email" />
  </Row>
  <Button type="submit" />
</Form>
