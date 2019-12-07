<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (options) => {
    return { entries: [{ type: 'string', min: 5 }, { type: 'string', min: 5 }], options }
  };

  const {
    entries: [default1Entry, default2Entry],
    createForm: defaultCreateForm
  } = getValidation(getConfig());

  const {
    entries: [true1Entry, true2Entry],
    createForm: trueCreateForm
  } = getValidation(getConfig({ includeAllEntries: true }));

  const {
    entries: [false1Entry, false2Entry],
    createForm: falseCreateForm
  } = getValidation(getConfig({ includeAllEntries: false }));

  let activeId = 'default';
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <Entry entry={default1Entry} />
    <Entry entry={default2Entry} noInput />
  </Form>
</Slide>

<Slide id="true" bind:activeId>
  <Form createForm={trueCreateForm}>
    <Entry entry={true1Entry} />
    <Entry entry={true2Entry} noInput />
  </Form>
</Slide>

<Slide id="false" bind:activeId>
  <Form createForm={falseCreateForm}>
    <Entry entry={false1Entry} />
    <Entry entry={false2Entry} noInput />
  </Form>
</Slide>
