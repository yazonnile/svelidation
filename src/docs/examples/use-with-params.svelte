<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/ui/error.svelte';
  import Row from 'docs/examples/components/row.svelte';
  import Form from 'docs/examples/components/form.svelte';
  import Code from 'docs/ui/code.svelte';
  import Button from 'docs/ui/button.svelte';

  const { createEntries, createForm } = createValidation({ validateOnEvents: { input: true }, listenInputEvents: 1 });
  const [
    [ errors, value, input ],
    [ errorsWithUseParams, valueWithUseParams, inputWithUseParams ]
  ] = createEntries([
    { type: 'string', min: 3, required: true },
    { type: 'string', min: 3, required: true },
  ]);
</script>

<Form {createForm} title="'use' directive with params">
  <Code code={`const [
  [ errors, value, input ],
  [ errorsWithUseParams, valueWithUseParams, inputWithUseParams ]
] = createEntries([
  { type: 'string', min: 3, required: true },
  { type: 'string', min: 3, required: true },
]);`} />
  <Code code={`<input use:input bind:value={$value} />
{#if $errors.includes('min')}Use at least 3 symbols{/if}
<input use:inputWithUseParams={{ validateOnEvents: { blur: true } }} bind:value={$valueWithUseParams} />
{#if $errorsWithUseParams.includes('min')}Use at least 3 symbols{/if}`} />
  <Row labelText="Validate on input">
    <input use:input bind:value={$value} class="input-text" placeholder="type: 'string', min: 3, required: true" />
    <Error {errors} errorCode="min" errorText="Use at least 3 symbols" />
  </Row>
  <Row labelText="Validate on blur">
    <input use:inputWithUseParams={{ validateOnEvents: { blur: true } }} bind:value={$valueWithUseParams} class="input-text" placeholder="type: 'string', min: 3, required: true" />
    <Error errors={errorsWithUseParams} errorCode="min" errorText="Use at least 3 symbols" />
  </Row>
  <Button type="submit" />
</Form>
