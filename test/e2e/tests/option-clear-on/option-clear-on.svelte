<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (options) => {
    return { entries: [{ type: 'string', minLength: 4 }], options }
  };

  const {
    entries: [[ defaultStore, defaultInput ]],
    createForm: defaultCreateForm
  } = getValidation(getConfig());

  const {
    entries: [[ focusStore, focusInput ]],
    createForm: focusCreateForm
  } = getValidation(getConfig({ clearOn: ['focus'] }));

  const {
    entries: [[ focusChangeResetStore, focusChangeResetInput ]],
    createForm: focusChangeResetCreateForm
  } = getValidation(getConfig({ clearOn: ['focus', 'change', 'reset'] }));

  let activeId = 'default';
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <Entry store={defaultStore} input={defaultInput} />
  </Form>
</Slide>

<Slide id="focus" bind:activeId>
  <Form createForm={focusCreateForm}>
    <Entry store={focusStore} input={focusInput} />
  </Form>
</Slide>

<Slide id="focus-change-reset" bind:activeId>
  <Form createForm={focusChangeResetCreateForm}>
    <Entry store={focusChangeResetStore} input={focusChangeResetInput} />
  </Form>
</Slide>
