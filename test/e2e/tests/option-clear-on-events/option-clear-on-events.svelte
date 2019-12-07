<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (options) => {
    return { entries: [{ type: 'string', min: 4 }], options }
  };

  const {
    entries: [defaultEntry],
    createForm: defaultCreateForm
  } = getValidation(getConfig());

  const {
    entries: [focusEntry],
    createForm: focusCreateForm
  } = getValidation(getConfig({ clearErrorsOnEvents:  { focus: true } }));

  const {
    entries: [focusChangeResetEntry],
    createForm: focusChangeResetCreateForm
  } = getValidation(getConfig({ clearErrorsOnEvents: { focus: true }, validateOnEvents: null }));

  let activeId = 'default';
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <Entry entry={defaultEntry} />
  </Form>
</Slide>

<Slide id="focus" bind:activeId>
  <Form createForm={focusCreateForm}>
    <Entry entry={focusEntry} />
  </Form>
</Slide>

<Slide id="focus-change-reset" bind:activeId>
  <Form createForm={focusChangeResetCreateForm}>
    <Entry entry={focusChangeResetEntry} />
  </Form>
</Slide>
