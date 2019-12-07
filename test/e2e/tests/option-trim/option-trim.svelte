<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (options) => {
    return { entries: [{ type: 'string', min: 5 }], options }
  };

  const {
    entries: [defaultEntry],
    createForm: defaultCreateForm
  } = getValidation(getConfig());

  const {
    entries: [trueEntry],
    createForm: trueCreateForm
  } = getValidation(getConfig({ trim: true }));

  const {
    entries: [falseEntry],
    createForm: falseCreateForm
  } = getValidation(getConfig({ trim: false }));

  const {
    entries: [mix1Entry, mix2Entry],
    createForm: mixCreateForm
  } = getValidation({
    entries: [{ type: 'string', min: 5 }, { type: 'string', trim: false, min: 5}],
    options: { trim: true }
  });

  let activeId = 'default';
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <Entry entry={defaultEntry} />
  </Form>
</Slide>

<Slide id="true" bind:activeId>
  <Form createForm={trueCreateForm}>
    <Entry entry={trueEntry} />
  </Form>
</Slide>

<Slide id="false" bind:activeId>
  <Form createForm={falseCreateForm}>
    <Entry entry={falseEntry} />
  </Form>
</Slide>

<Slide id="mix" bind:activeId>
  <Form createForm={mixCreateForm}>
    <Entry entry={mix1Entry} />
    <Entry entry={mix2Entry} />
  </Form>
</Slide>
