<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';
  import { ListenInputEventsEnum } from 'dist';

  const getConfig = (options) => {
    return { entries: [{ type: 'string', min: 4 }], options }
  };

  const {
    entries: [defaultEntry],
    createForm: defaultCreateForm
  } = getValidation(getConfig());

  const {
    entries: [neverEntry],
    createForm: neverCreateForm
  } = getValidation(getConfig({ listenInputEvents: ListenInputEventsEnum.never }));

  const {
    entries: [alwaysEntry],
    createForm: alwaysCreateForm
  } = getValidation(getConfig({ listenInputEvents: ListenInputEventsEnum.always }));

  let activeId = 'default';
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <Entry entry={defaultEntry} />
  </Form>
</Slide>

<Slide id="never" bind:activeId>
  <Form createForm={neverCreateForm}>
    <Entry entry={neverEntry} />
  </Form>
</Slide>

<Slide id="always" bind:activeId>
  <Form createForm={alwaysCreateForm}>
    <Entry entry={alwaysEntry} />
  </Form>
</Slide>
