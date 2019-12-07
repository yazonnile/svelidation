<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (options) => {
    return { entries: [{ type: 'email' }], options }
  };

  const {
    entries: [defaultEntry],
    createForm: defaultCreateForm
  } = getValidation(getConfig());

  const {
    entries: [requiredEntry],
    createForm: requiredCreateForm
  } = getValidation(getConfig({ presence: 'required' }));

  const {
    entries: [optionalEntry],
    createForm: optionalCreateForm
  } = getValidation(getConfig({ presence: 'optional' }));

  const {
    entries: [mix1Entry, mix2Entry],
    createForm: mixCreateForm
  } = getValidation({
    entries: [{ type: 'email' }, { type: 'email', optional: true }],
    options: { presence: 'required' }
  });

  let activeId = 'default';
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <Entry entry={defaultEntry} />
  </Form>
</Slide>

<Slide id="required" bind:activeId>
  <Form createForm={requiredCreateForm}>
    <Entry entry={requiredEntry} />
  </Form>
</Slide>

<Slide id="optional" bind:activeId>
  <Form createForm={optionalCreateForm}>
    <Entry entry={optionalEntry} />
  </Form>
</Slide>

<Slide id="mix" bind:activeId>
  <Form createForm={mixCreateForm}>
    <Entry entry={mix1Entry} />
    <Entry entry={mix2Entry} />
  </Form>
</Slide>
