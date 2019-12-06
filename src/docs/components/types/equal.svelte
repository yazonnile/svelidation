<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/components/error/error.svelte';
  import Row from 'docs/components/row/row.svelte';
  import Form from 'docs/components/form/form.svelte';
  import Code from 'docs/components/code/code.svelte';

  const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
  const [ errors, value, input ] = createEntry({
    type: 'string', equal: 'qwerty'
  });
</script>

<Form {createForm}>
  <h1>equal</h1>
  <Code html={`const [ errors, value, input ] = createEntry({
  type: 'string', equal: 'qwerty'
});`} />
  <Code html={`&lt;input use:input bind:value={$value} />
{#if $errors.includes('equal')}Should be equal to 'qwerty'{/if}`} />
  <Row labelText="Type 'qwerty'">
    <input use:input bind:value={$value} class="input-text" type="text" placeholder="type: 'string', equal: 'qwerty'" />
    <Error {errors} errorCode="equal" errorText="Should be equal to 'qwerty'" />
  </Row>
</Form>
