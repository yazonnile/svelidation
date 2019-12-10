<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';
  import { ListenInputEventsEnum } from 'dist';

  const getConfig = (options) => {
    return { entries: [{ type: 'string', min: 4 }, { type: 'string', min: 4 }], options }
  };

  const {
    entries: [defaultEntry, defaultEntryWithUseParams],
    createForm: defaultCreateForm
  } = getValidation(getConfig());

  const {
    entries: [neverEntry, neverEntryWithUseParams],
    createForm: neverCreateForm
  } = getValidation(getConfig({ listenInputEvents: ListenInputEventsEnum.never }));

  const {
    entries: [alwaysEntry, alwaysEntryWithUseParams],
    createForm: alwaysCreateForm
  } = getValidation(getConfig({ listenInputEvents: ListenInputEventsEnum.always }));

  let activeId = 'default';

  const inputOpts = {
    validateOnEvents: { input: true }
  }
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <Entry entry={defaultEntry} />
    <Entry entry={defaultEntryWithUseParams} {inputOpts} />
  </Form>
</Slide>

<Slide id="never" bind:activeId>
  <Form createForm={neverCreateForm}>
    <Entry entry={neverEntry} />
    <Entry entry={neverEntryWithUseParams} {inputOpts} />
  </Form>
</Slide>

<Slide id="always" bind:activeId>
  <Form createForm={alwaysCreateForm}>
    <Entry entry={alwaysEntry} />
    <Entry entry={alwaysEntryWithUseParams} {inputOpts} />
  </Form>
</Slide>
