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
    [ errorsMax, valueMax, inputMax ],
  ] = createEntries([
    { type: 'number', min: 18, required: true },
    { type: 'number', max: 18, required: true }
  ]);

  const jsCode = `const [
  [ errorsMin, valueMin, inputMin ],
  [ errorsMax, valueMax, inputMax ],
] = createEntries([
  { type: 'number', min: 18, required: true },
  { type: 'number', max: 18, required: true }
]);`;

  const htmlCode = `<input use:inputMin bind:value={$valueMin} type="number" />
{#if $errorsMin.includes('required')}
  This field is required
{/if}
{if $errorsMin.includes('min')}
  For boomers only!
{/if}
<input use:inputMax bind:value={$valueMax} type="number" />
{#if $errorsMax.includes('required')}
  This field is required
{/if}
{if $errorsMax.includes('max')}
  Not for boomers!
{/if}`;
</script>

<Form {createForm} title="number" subtitle="min, max, between" type>
  <Code code={jsCode} />
  <Code code={htmlCode} />
  <Row labelText="Type your age #1">
    <input use:inputMin bind:value={$valueMin} class="input-text" type="number" placeholder="type: 'number', min: 18, required: true" />
    <Error errors={errorsMin} errorCode="required" />
    <Error errors={errorsMin} errorCode="min" errorText="For boomers only!" />
  </Row>
  <Row labelText="Type your age #2">
    <input use:inputMax bind:value={$valueMax} class="input-text" type="number" placeholder="type: 'number', max: 18, required: true" />
    <Error errors={errorsMax} errorCode="required" />
    <Error errors={errorsMax} errorCode="max" errorText="Not for boomers!" />
  </Row>
  <Button type="submit" />
</Form>
