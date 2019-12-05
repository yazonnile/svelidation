<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/components/error/error.svelte';
  import Cells from 'docs/components/cells/cells.svelte';
  import Row from 'docs/components/row/row.svelte';
  import Form from 'docs/components/form/form.svelte';
  import Code from 'docs/components/code/code.svelte';

  const { createEntry: createEntry1, createForm: createForm1 } = createValidation({ validateOnEvents: { input: true } });
  const { createEntry: createEntry2, createForm: createForm2 } = createValidation({ validateOnEvents: { input: true } });
  const [ errors, value, input ] = createEntry1({
    type: 'array',
    required: true,
    value: []
  });

  const [ errorsSelect, valueSelect, inputSelect ] = createEntry2({
    type: 'array',
    required: true,
    value: []
  });
</script>

<Form createForm={createForm1}>
  <h1>array checkbox</h1>
  <Code html={`const [ errors, value, input ] = createEntry({
  type: 'array',
  required: true,
  value: []
});`} />
  <Code html={`&lt;input use:input bind:group={$value} value={1} type="checkbox" /> First option
&lt;input use:input bind:group={$value} value={2} type="checkbox" /> Second option
&lt;input use:input bind:group={$value} value={3} type="checkbox" /> Third option
{#if $errors.includes('required')}Pick something please{/if}`} />
  <Cells>
    <label><input use:input bind:group={$value} value={1} class="input-choice" type="checkbox" /> First option</label>
    <label><input use:input bind:group={$value} value={2} class="input-choice" type="checkbox" /> Second option</label>
    <label><input use:input bind:group={$value} value={3} class="input-choice" type="checkbox" /> Third option</label>
  </Cells>
  <Error {errors} errorCode="required" errorText="Pick something please" />
</Form>
<Form createForm={createForm2}>
  <h1>array select</h1>

  <Code html={`const [ errors, value, input ] = createEntry({
  type: 'array',
  required: true,
  value: []
});`} />
  <Code html={`&lt;select multiple bind:value={$valueSelect} use:inputSelect>
  &lt;option value={1}>First lorem ipsum&lt;/option>
  &lt;option value={2}>Second lorem ipsum&lt;/option>
  &lt;option value={3}>Third lorem ipsum&lt;/option>
&lt;/select>
{#if $errors.includes('required')}Pick something please{/if}`} />
  <Row labelText="Pick few options">
    <select multiple bind:value={$valueSelect} use:inputSelect>
      <option value={1}>First lorem ipsum</option>
      <option value={2}>Second lorem ipsum</option>
      <option value={3}>Third lorem ipsum</option>
    </select>
    <Error errors={errorsSelect} errorCode="required" errorText="Pick something please" />
  </Row>
</Form>
