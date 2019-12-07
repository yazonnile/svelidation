<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/ui/error.svelte';
  import Row from 'docs/examples/components/row.svelte';
  import Form from 'docs/examples/components/form.svelte';
  import Code from 'docs/ui/code.svelte';
  import Button from 'docs/ui/button.svelte';

  const { createEntry: createEntry1, createForm: createForm1 } = createValidation({ validateOnEvents: { input: true } });
  const { createEntry: createEntry2, createForm: createForm2 } = createValidation({ validateOnEvents: { input: true } });
  const [ errors, value, input ] = createEntry1({
    type: 'array',
    min: 2,
    value: []
  });

  const [ errorsSelect, valueSelect, inputSelect ] = createEntry2({
    type: 'array',
    required: true,
    value: []
  });

  const js1 = `const [ errors, value, input ] = createEntry({
  type: 'array',
  min: 2,
  value: []
});`;

  const html1 = `<input use:input bind:group={$value} value={1} type="checkbox" /> First option
<input use:input bind:group={$value} value={2} type="checkbox" /> Second option
<input use:input bind:group={$value} value={3} type="checkbox" /> Third option
{#if $errors.includes('required')}Pick something please{/if}`;

  const js2 = `const [ errors, value, input ] = createEntry({
  type: 'array',
  required: true,
  value: []
});`;

  const html2 = `<select multiple bind:value={$valueSelect} use:inputSelect>
  <option value={1}>First lorem ipsum</option>
  <option value={2}>Second lorem ipsum</option>
  <option value={3}>Third lorem ipsum</option>
</select>
{#if $errors.includes('required')}Pick something please{/if}`;
</script>

<Form createForm={createForm1} title="array" subtitle="min, max, includes" type>
  <Code code={js1} />
  <Code code={html1} />
  <div class="cells">
    <label><input use:input bind:group={$value} value={1} class="input-choice" type="checkbox" /> First option</label>
    <label><input use:input bind:group={$value} value={2} class="input-choice" type="checkbox" /> Second option</label>
    <label><input use:input bind:group={$value} value={3} class="input-choice" type="checkbox" /> Third option</label>
  </div>
  <Error {errors} errorCode="min" errorText="Pick at least 2, please" />
  <Button type="submit" />
</Form>

<Form createForm={createForm2} title="array" subtitle="min, max, includes" type>
  <Code code={js2} />
  <Code code={html2} />
  <Row labelText="Pick few options">
    <select multiple bind:value={$valueSelect} use:inputSelect>
      <option value={1}>First lorem ipsum</option>
      <option value={2}>Second lorem ipsum</option>
      <option value={3}>Third lorem ipsum</option>
    </select>
    <Error errors={errorsSelect} errorCode="required" errorText="Pick something please" />
  </Row>
  <Button type="submit" />
</Form>
