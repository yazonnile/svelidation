<script>
  import createValidation from 'lib/lib';
  import Error from 'docs/ui/error.svelte';
  import Row from 'docs/examples/components/row.svelte';
  import Form from 'docs/examples/components/form.svelte';
  import Code from 'docs/ui/code.svelte';
  import Button from 'docs/ui/button.svelte';

  const { createEntries, createForm, getValues } = createValidation({
    validateOnEvents: { input: true },
    getValues: entries => {
      return entries.reduce((result, { value, params }) => {
        result[params.MY_CUSTOM_KEY] = value;
        return result;
      }, {});
    },
    warningsEnabled: false
  });
  const [
    [ loginErrors, loginValue, loginInput ],
    [ passwordErrors, passwordValue, passwordInput ]
  ] = createEntries([
    { type: 'string', between: [2, 10], required: true, MY_CUSTOM_KEY: 'login' },
    { type: 'string', required: true, trim: false, MY_CUSTOM_KEY: 'password' },
  ]);

  let result;
  $: result = getValues(), $loginValue, $passwordValue;
</script>

<Form {createForm} title="GET VALUES CUSTOM">
  <Code code={`const { createEntries, createForm, getValues } = createValidation({
  validateOnEvents: { input: true },
  getValues: entries => {
    return entries.reduce((result, { value, params }) => {
      result[params.MY_CUSTOM_KEY] = value;
      return result;
    }, {});
  },
  warningsEnabled: false
});
const [
  [ loginErrors, loginValue, loginInput ],
  [ passwordErrors, passwordValue, passwordInput ]
] = createEntries([
  { type: 'string', between: [2, 10], required: true, MY_CUSTOM_KEY: 'login' },
  { type: 'string', required: true, trim: false, MY_CUSTOM_KEY: 'password' },
]);

let result;
$: result = getValues(), $loginValue, $passwordValue;`} />
  <Code code={`<input use:loginInput bind:value={$loginValue} />
{#if $errors.includes('between')}Use at least 2 and not more than 10 symbols{/if}
{#if $errors.includes('required')}Field is required{/if}
<input use:passwordInput bind:value={$passwordValue} type="password" />
{#if $errors.includes('required')}Field is required{/if}
{JSON.stringify(result, null, '  ')}`} />
  <Row>
    <input use:loginInput bind:value={$loginValue} class="input-text" placeholder="type: 'string', min: 3" />
    <Error errors={loginErrors} errorCode="between" errorText="Use at least 2 and not more than 10 symbols" />
    <Error errors={loginErrors} errorCode="required" />
  </Row>
  <Row>
    <input use:passwordInput bind:value={$passwordValue} class="input-text" type="password" placeholder="type: 'string', max: 5, required: true" />
    <Error errors={passwordErrors} errorCode="required" />
  </Row>
  <Row>
    <pre>{JSON.stringify(result, null, '  ')}</pre>
  </Row>
  <Button type="submit" />
</Form>
