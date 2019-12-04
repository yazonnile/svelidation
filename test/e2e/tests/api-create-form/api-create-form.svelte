<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = () => {
    return { entries: [{ type: 'string', min: 4 }, { type: 'string', min: 4 }] }
  };

  const {
    entries: [[ submitStore, submitInput ]],
    createForm: submitCreateForm
  } = getValidation(getConfig());

  const {
    entries: [[ successFailStore, successFailInput ]],
    createForm: successFailCreateForm
  } = getValidation(getConfig());

  const {
    entries: [[ reset1Store, reset1Input ], [ reset2Store ]],
    createForm: resetCreateForm,
    validateStore
  } = getValidation(getConfig());

  validateStore(reset2Store);

  let activeId = 'submit';
  $: log = activeId && [];
  const onSubmit = () => { log = [...log, 'submit'] };
  const onSuccess = () => { log = [...log, 'success'] };
  const onFail = () => { log = [...log, 'fail'] };
</script>

<Slide id="submit" bind:activeId>
  <Form createForm={submitCreateForm} createFormParams={{ onSubmit }}>
    <Entry store={submitStore} input={submitInput} />
  </Form>
  <div class="log">{#each log as item}{item},{/each}</div>
</Slide>

<Slide id="successFail" bind:activeId>
  <Form createForm={successFailCreateForm} createFormParams={{ onFail, onSuccess}}>
    <Entry store={successFailStore} input={successFailInput} />
    <div class="log">{#each log as item}{item},{/each}</div>
  </Form>
</Slide>

<Slide id="reset" bind:activeId>
  <Form createForm={resetCreateForm}>
    <Entry store={reset1Store} input={reset1Input} />
    <Entry store={reset2Store} />
  </Form>
</Slide>
