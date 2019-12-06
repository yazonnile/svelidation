<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/ui/error.svelte';
  import Row from 'docs/examples/components/row.svelte';
  import Form from 'docs/examples/components/form.svelte';
  import Code from 'docs/ui/code.svelte';
  import Button from 'docs/ui/button.svelte';

  const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
  const [ errorsF1, valueF1, inputF1 ] = createEntry({
    type: 'string', min: 6, match: /\d+/
  });

  const [ errorsF2, valueF2, inputF2 ] = createEntry({
    type: 'string', required: true, equal: (value) => {
      return value === $valueF1;
    }
  });

  const jsCode = `const { createEntry, createForm } = createValidation({ validateOnEvents: { input: true } });
  const [ errorsF1, valueF1, inputF1 ] = createEntry({
    type: 'string', min: 6, match: /\d+/
  });

  const [ errorsF2, valueF2, inputF2 ] = createEntry({
    type: 'string', required: true, equal: (value) => {
    return value === $valueF1;
  }
});`;

  const htmlCode = `<input use:inputF1 bind:value={$valueF1} />
{#if $errorsF1.includes('min')}At least 6 symbols{/if}
{#if $errorsF1.includes('match')}TUse at one digit{/if}

<input use:inputF2 bind:value={$valueF2} />
{#if $errorsF2.includes('required')}This field is required{/if}
{#if $errorsF2.includes('equal')}Should be equal with second one{/if}`;
</script>

<Form {createForm} title="Confirm password">
  <Code code={jsCode} />
  <Code code={htmlCode} />
  <Row>
    Type your password
    <input use:inputF1 bind:value={$valueF1} class="input-text" type="password" placeholder="type: 'string', min: 6, match: /d+/" />
    <Error errors={errorsF1} errorCode="min" errorText="At least 6 symbols" />
    <Error errors={errorsF1} errorCode="match" errorText="Use at one digit" />
  </Row>
  <Row>
    Confirm your password
    <input use:inputF2 bind:value={$valueF2} class="input-text" type="password" placeholder="type: 'string', required: true, equal: function" />
    <Error errors={errorsF2} errorCode="required" />
    <Error errors={errorsF2} errorCode="equal" errorText="Should be equal with second one" />
  </Row>
  <Button type="submit" />
</Form>
