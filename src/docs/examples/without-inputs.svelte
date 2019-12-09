<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/ui/error.svelte';
  import Form from 'docs/examples/components/form.svelte';
  import Code from 'docs/ui/code.svelte';
  import Button from 'docs/ui/button.svelte';

  const { createEntry, createForm, validateValueStore } = createValidation({
    includeAllEntries: true
  });

  let [ errors, value, input ] = createEntry({
    type: 'number',
    min: 3,
    max: 5,
    value: 3
  });
</script>

<Form {createForm} title="Without inputs">
  <Code code={`const { createEntry, createForm, validateValueStore } = createValidation({
  includeAllEntries: true
});

let [ errors, value, input ] = createEntry({
  type: 'number',
  min: 3,
  max: 5,
  value: 3
});`} />
  <Code code={`<button on:click={() => ($value--, validateValueStore(value))}>-</button>
<span>{$value}</span>
<button on:click={() => ($value++, validateValueStore(value))}>+</button>
{#if $errors.includes('min')}3 is min{/if}
{#if $errors.includes('max')}5 is max{/if}`} />
  <Button on:click={() => ($value--, validateValueStore(value))}>-</Button>
  <span>{$value}</span>
  <Button on:click={() => ($value++, validateValueStore(value))}>+</Button>
  <Error {errors} errorCode="min" errorText="3 is min" />
  <Error {errors} errorCode="max" errorText="5 is max" />
</Form>

<style>
  span {
    display: inline-block;
    font-size: 30px;
    line-height: 30px;
    margin-top: 5px;
    vertical-align: top;
  }

  :global(button) {
    min-width: 40px;
  }
</style>
