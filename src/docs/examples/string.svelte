<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/ui/error.svelte';
  import Row from 'docs/examples/components/row.svelte';
  import Form from 'docs/examples/components/form.svelte';
  import Code from 'docs/ui/code.svelte';
  import Button from 'docs/ui/button.svelte';

  const { createEntries, createForm } = createValidation({ validateOnEvents: { input: true } });
  const [
    [ errorsMin, valueMin, inputMin ],
    [ errorsMax, valueMax, inputMax ]
  ] = createEntries([
    { type: 'string', min: 3 },
    { type: 'string', max: 5, required: true },
  ]);
</script>

<Form {createForm} title="string" subtitle="min, max, between" type>
  <Code code={`const [
  [ errorsMin, valueMin, inputMin ],
  [ errorsMax, valueMax, inputMax ]
] = createEntries([
  { type: 'string', min: 3 },
  { type: 'string', max: 5, required: true },
]);`} />
  <Code code={`<input use:inputMin bind:value={$valueMin} />
{#if $errorsMin.includes('min')}Use at least 3 symbols{/if}
<input use:inputMax bind:value={$valueMax} />
{#if $errorsMax.includes('max')}Use 5 or less symbols{/if}
{#if $errorsMax.includes('required')}This field is required{/if}`} />
  <Row>
    <input use:inputMin bind:value={$valueMin} class="input-text" placeholder="type: 'string', min: 3" />
    <Error errors={errorsMin} errorCode="min" errorText="Use at least 3 symbols" />
  </Row>
  <Row>
    <input use:inputMax bind:value={$valueMax} class="input-text" placeholder="type: 'string', max: 5, required: true" />
    <Error errors={errorsMax} errorCode="max" errorText="Use 5 or less symbols" />
    <Error errors={errorsMax} errorCode="required" />
  </Row>
  <Button type="submit" />
</Form>
