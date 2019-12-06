<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/components/error/error.svelte';
  import Row from 'docs/components/row/row.svelte';
  import Form from 'docs/components/form/form.svelte';
  import Code from 'docs/components/code/code.svelte';

  const { createEntries, createForm } = createValidation({ validateOnEvents: { input: true } });
  const [
    [ errorsMin, valueMin, inputMin ],
    [ errorsMax, valueMax, inputMax ]
  ] = createEntries([
    { type: 'string', min: 3 },
    { type: 'string', max: 5, required: true },
  ]);
</script>

<Form {createForm}>
  <h1>string</h1>
  <Code html={`const [
  [ errorsMin, valueMin, inputMin ],
  [ errorsMax, valueMax, inputMax ]
] = createEntries([
  { type: 'string', min: 3 },
  { type: 'string', max: 5, required: true },
]);`} />
  <Code html={`&lt;input use:inputMin bind:value={$valueMin} />
{#if $errorsMin.includes('min')}Use at least 3 symbols{/if}
&lt;input use:inputMax bind:value={$valueMax} />
{#if $errorsMax.includes('max')}Use 5 or less symbols{/if}`} />
  <Row>
    <input use:inputMin bind:value={$valueMin} class="input-text" placeholder="type: 'string', min: 3" />
    <Error errors={errorsMin} errorCode="min" errorText="Use at least 3 symbols" />
  </Row>
  <Row>
    <input use:inputMax bind:value={$valueMax} class="input-text" placeholder="type: 'string', max: 5, required: true" />
    <Error errors={errorsMax} errorCode="max" errorText="Use 5 or less symbols" />
    <Error errors={errorsMax} errorCode="required" />
  </Row>
</Form>
