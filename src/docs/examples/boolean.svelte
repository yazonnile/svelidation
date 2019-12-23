<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/ui/error.svelte';
  import Form from 'docs/examples/components/form.svelte';
  import Row from 'docs/examples/components/row.svelte';
  import Code from 'docs/ui/code.svelte';
  import Button from 'docs/ui/button.svelte';

  const { createEntry, createForm } = createValidation({ validateOnEvents: { change: true } });
  const [ errors, value, input ] = createEntry({
    value: false,
    type: 'boolean',
    required: true
  });

  const jsCode = `const [ errors, value, input ] = createEntry({
  value: false,
  type: 'boolean',
  required: true
});`;

  const htmlCode = `<input use:input bind:checked={$value} type="checkbox" />
{#if $errors.includes('required')}Please check{/if}`;
</script>

<Form {createForm} title="boolean" type>
  <Code code={jsCode} />
  <Code code={htmlCode} />
  <div class="cells">
    <label><input bind:checked={$value} use:input class="input-choice" type="checkbox" /> Are you agree?</label>
  </div>
  <Error {errors} errorCode="required" errorText="Please check" />
  <Button type="submit" />
</Form>
