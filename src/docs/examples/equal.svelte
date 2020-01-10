<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/ui/error.svelte';
  import Row from 'docs/examples/components/row.svelte';
  import Form from 'docs/examples/components/form.svelte';
  import Code from 'docs/ui/code.svelte';
  import Button from 'docs/ui/button.svelte';

  const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
  const [ errors, value, input ] = createEntry({
    type: 'string', equal: 'qwerty', required: true
  });

  const jsCode = `const [ errors, value, input ] = createEntry({
  type: 'string', equal: 'qwerty', required: true
});`;

  const htmlCode = `<input use:input bind:value={$value} />
{#if $errors.includes('equal')}Should be equal to 'qwerty'{/if}
{#if $errors.includes('required')}This field is required{/if}`;
</script>

<Form {createForm} title="equal" rule>
  <Code code={jsCode} />
  <Code code={htmlCode} />
  <Row labelText="Type 'qwerty'">
    <input use:input bind:value={$value} class="input-text" type="text" placeholder="type: 'string', equal: 'qwerty'" />
    <Error {errors} errorCode="equal" errorText="Should be equal to 'qwerty'" />
    <Error {errors} errorCode="required" />
  </Row>
  <Button type="submit" />
</Form>
