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
    entries: [emptyEntry],
    createForm: emptyCreateForm
  } = getValidation(getConfig({ validateOnEvents: null }));

  const {
    entries: [blurEntry],
    createForm: blurCreateForm
  } = getValidation(getConfig({ validateOnEvents: { blur: true }}));

  let activeId = 'default';
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <Entry entry={defaultEntry} />
  </Form>
</Slide>

<Slide id="empty" bind:activeId>
  <Form createForm={emptyCreateForm}>
    <Entry entry={emptyEntry} />
  </Form>
</Slide>

<Slide id="blur" bind:activeId>
  <Form createForm={blurCreateForm}>
    <Entry entry={blurEntry} />
  </Form>
</Slide>
