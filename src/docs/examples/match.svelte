<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/ui/error.svelte';
  import Row from 'docs/examples/components/row.svelte';
  import Form from 'docs/examples/components/form.svelte';
  import Code from 'docs/ui/code.svelte';
  import Button from 'docs/ui/button.svelte';

  const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
  const [ errors, value, input ] = createEntry({
    type: 'string', match: /^A.*B$/
  });

  const jsCode = `const [ errors, value, input ] = createEntry({
  type: 'string', match: /^A.*B$/
});`;

  const htmlCode = `<input use:input bind:value={$value} />
{#if $errors.includes('match')}Should start from 'A' letter and ends with 'B' letter{/if}`;
</script>

<Form {createForm} title="match" rule>
  <Code code={jsCode} />
  <Code code={htmlCode} />
  <Row labelText="Type something like AxxxxxxB">
    <input use:input bind:value={$value} class="input-text" type="text" placeholder="type: 'string', match: /^A.*B$/" />
    <Error {errors} errorCode="match" errorText="Should start from 'A' letter and ends with 'B' letter" />
  </Row>
  <Button type="submit" />
</Form>
