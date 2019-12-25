<script>
  import createValidation from 'lib/lib';
  import Row from 'docs/examples/components/row.svelte';
  import Form from 'docs/examples/components/form.svelte';
  import Code from 'docs/ui/code.svelte';
  import Button from 'docs/ui/button.svelte';

  const { createEntry, createForm } = createValidation({
    validateOnEvents: { input: true },
    useCustomErrorsStore: (errors, params) => {
      return errors.reduce((result, ruleName) => {
        result[ruleName] = params[ruleName];
        return result;
      }, {});
    }
  });

  const [ errors, value, input ] = createEntry({ type: 'string', min: 5, required: true });
</script>

<Form {createForm} title="Custom errors">
  <Code code={`const { createEntry, createForm } = createValidation({
  validateOnEvents: { input: true },
  useCustomErrorsStore: (errors, params) => {
    return errors.reduce((result, ruleName) => {
      result[ruleName] = params[ruleName];
      return result;
    }, {});
  }
});

const [ errors, value, input ] = createEntry({ type: 'string', min: 5, required: true });`} />
  <Code code={`<input use:input bind:value={$value} />
{#each Object.keys($errors) as errorCode}
  Problem with {errorCode}: {$errors[errorCode]}
{/each}`} />
  <Row>
    <input use:input bind:value={$value} class="input-text" placeholder="type: 'string', min: 5, required: true" />
    {#each Object.keys($errors) as errorCode}
      <p style="color: #f00">Problem with {errorCode}: {$errors[errorCode]}</p>
    {/each}
  </Row>
  <Button type="submit" />
</Form>
