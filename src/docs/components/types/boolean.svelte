<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/components/error/error.svelte';
  import Cells from 'docs/components/cells/cells.svelte';
  import Form from 'docs/components/form/form.svelte';
  import Code from 'docs/components/code/code.svelte';

  const { createEntry, createForm } = createValidation({ validateOnEvents: { change: true } });
  const [ errors, value, input ] = createEntry({
    value: false,
    type: 'boolean',
    required: true
  });
</script>

<Form {createForm}>
  <h1>boolean</h1>
  <Code html={`const [ errors, value, input ] = createEntry({
  value: false,
  type: 'boolean',
  required: true
});`} />
  <Code html={`&lt;input use:inputMin bind:value={$valueMin} class="input-text" />
&lt;input use:input bind:checked={$value} type="checkbox" />
{#if $errors.includes('required')}Please check{/if}`} />
  <Cells>
    <label><input bind:checked={$value} use:input class="input-choice" type="checkbox" /> Are you agree?</label>
  </Cells>
  <Error {errors} errorCode="required" errorText="Please check" />
</Form>
