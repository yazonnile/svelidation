<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/components/error/error.svelte';
  import Row from 'docs/components/row/row.svelte';
  import Form from 'docs/components/form/form.svelte';
  import Code from 'docs/components/code/code.svelte';

  const { createEntries, createForm } = createValidation({ validateOnEvents: { input: true } });
  const [
    [ errorsMin, valueMin, inputMin ],
    [ errorsMax, valueMax, inputMax ],
  ] = createEntries([
    { type: 'number', min: 18, required: true },
    { type: 'number', max: 18, required: true }
  ]);
</script>

<Form {createForm}>
  <h1>number</h1>
  <Code html={`const [
  [ errorsMin, valueMin, inputMin ],
  [ errorsMax, valueMax, inputMax ],
] = createEntries([
  { type: 'number', min: 18, required: true },
  { type: 'number', max: 18, required: true }
]);`} />
  <Code html={`&lt;input use:inputMin bind:value={$valueMin} type="number" />
{#if $errorsMin.includes('required')}
  This field is required
{:else if $errorsMin.includes('min')}
  For boomers only!
{/if}
&lt;input use:inputMax bind:value={$valueMax} type="number" />
{#if $errorsMax.includes('required')}
  This field is required
{:else if $errorsMax.includes('max')}
  Not for boomers!
{/if}`} />
  <Row labelText="Type your age #1">
    <input use:inputMin bind:value={$valueMin} class="input-text" type="number" placeholder="type: 'number', min: 18, required: true" />
    {#if $errorsMin.includes('required')}
      <Error errors={errorsMin} errorCode="required" />
    {:else}
      <Error errors={errorsMin} errorCode="min" errorText="For boomers only!" />
    {/if}
  </Row>
  <Row labelText="Type your age #2">
    <input use:inputMax bind:value={$valueMax} class="input-text" type="number" placeholder="type: 'number', max: 18, required: true" />
    {#if $errorsMax.includes('required')}
      <Error errors={errorsMin} errorCode="required" />
    {:else}
      <Error errors={errorsMax} errorCode="max" errorText="Not for boomers!" />
    {/if}
  </Row>
</Form>
