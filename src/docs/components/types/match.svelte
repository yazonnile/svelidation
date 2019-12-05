<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/components/error/error.svelte';
  import Row from 'docs/components/row/row.svelte';
  import Form from 'docs/components/form/form.svelte';
  import Code from 'docs/components/code/code.svelte';

  const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
  const [ errors, value, input ] = createEntry({
    type: 'string', match: /^A.*B$/
  });
</script>

<Form {createForm}>
  <h1>match</h1>
  <Code html={`const [ errors, value, input ] = createEntry({
  type: 'string', match: /^A.*B$/
});`} />
  <Code html={`&lt;input use:input bind:value={$value} />
{#if $errors.includes('match')}Should start from 'A' letter and ends with 'B' letter{/if}`} />
  <Row labelText="Type something like AxxxxxxB">
    <input use:input bind:value={$value} class="input-text" type="text" />
    <Error {errors} errorCode="match" errorText="Should start from 'A' letter and ends with 'B' letter" />
  </Row>
</Form>
