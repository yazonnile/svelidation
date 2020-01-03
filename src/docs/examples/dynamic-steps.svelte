<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/ui/error.svelte';
  import Row from 'docs/examples/components/row.svelte';
  import Form from 'docs/examples/components/form.svelte';
  import Code from 'docs/ui/code.svelte';
  import Button from 'docs/ui/button.svelte';

  const { createEntries, createForm } = createValidation({ validateOnEvents: { input: true } });
  const [
    [ step1Errors, step1Value, step1Input ],
    [ step2Errors, step2Value, step2Input ]
  ] = createEntries([
    { type: 'string', required: true },
    { type: 'string', required: true },
  ]);

  let step = 0;

  const onSuccess = () => step++;
</script>

<Form {createForm} createFormOpts={{ onSuccess }} title="Dynamic steps">
  <Code code={`const { createEntries, createForm } = createValidation({ validateOnEvents: { input: true } });
const [
  [ step1Errors, step1Value, step1Input ],
  [ step2Errors, step2Value, step2Input ]
] = createEntries([
  { type: 'string', required: true },
  { type: 'string', required: true },
]);

let step = 0;
const onSuccess = () => step++;`} />
  <Code code={`<form use:createForm={{ onSuccess }} on:submit|preventDefault>
  <p>current step is #{step+1}</p>
  {#if step === 0}
    <input use:step1Input bind:value={$step1Value} />
    {#if $step1Errors.includes('required')}This field is required{/if}
    <button type="submit">Next step</button>
  {:else if step === 1}
    <input use:step2Input bind:value={$step2Value} />
    {#if $step2Errors.includes('required')}This field is required{/if}
    <button type="submit">Submit</button>
  {:else}
    <p>SUCCESS</p>
  {/if}
</form>`} />
  <p>current step is #{step+1}</p>
  {#if step === 0}
    <Row>
      <input use:step1Input bind:value={$step1Value} class="input-text" placeholder="type: 'string', required: true" />
      <Error errors={step1Errors} errorCode="required" />
    </Row>
    <Button type="submit">Next step</Button>
  {:else if step === 1}
    <Row>
      <input use:step2Input bind:value={$step2Value} class="input-text" placeholder="type: 'string', required: true" />
      <Error errors={step2Errors} errorCode="required" />
    </Row>
    <Button type="submit">Submit</Button>
  {:else}
    <p>SUCCESS</p>
  {/if}
</Form>
