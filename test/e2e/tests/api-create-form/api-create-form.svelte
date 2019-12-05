<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = () => {
    return { entries: [{ type: 'string', min: 4 }, { type: 'string', min: 4 }] }
  };

  const {
    entries: [submitEntry],
    createForm: submitCreateForm
  } = getValidation(getConfig());

  const {
    entries: [successFailEntry],
    createForm: successFailCreateForm
  } = getValidation(getConfig());

  const {
    entries: [
      reset1Entry,
      reset2Entry,
    ],
    createForm: resetCreateForm,
    validateValueStore
  } = getValidation(getConfig());

  validateValueStore(reset2Entry[1]);

  let activeId = 'submit';
  $: log = activeId && [];
  const onSubmit = () => { log = [...log, 'submit'] };
  const onSuccess = () => { log = [...log, 'success'] };
  const onFail = () => { log = [...log, 'fail'] };
</script>

<Slide id="submit" bind:activeId>
  <Form createForm={submitCreateForm} createFormParams={{ onSubmit }}>
    <Entry entry={submitEntry} />
  </Form>
  <div class="log">{#each log as item}{item},{/each}</div>
</Slide>

<Slide id="successFail" bind:activeId>
  <Form createForm={successFailCreateForm} createFormParams={{ onFail, onSuccess}}>
    <Entry entry={successFailEntry} />
    <div class="log">{#each log as item}{item},{/each}</div>
  </Form>
</Slide>

<Slide id="reset" bind:activeId>
  <Form createForm={resetCreateForm}>
    <Entry entry={reset1Entry} />
    <Entry entry={reset2Entry} noInput />
  </Form>
</Slide>
