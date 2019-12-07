<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (entriesCount) => {
    return { entries: Array(entriesCount).fill({ type: 'string', min: 4 }) }
  };

  const {
    entries: [
      noUseEntry,
      useEntry,
      inputOptsEntry,
    ],
    createForm: noUseCreateForm
  } = getValidation(getConfig(3));

  const {
    entries: [hiddenEntry],
    createForm: hiddenCreateForm
  } = getValidation(getConfig(1));

  let activeId = 'use';
</script>

<Slide id="use" bind:activeId>
  <Form createForm={noUseCreateForm}>
    <Entry entry={noUseEntry} noInput />
    <Entry entry={useEntry} />
    <Entry entry={inputOptsEntry} inputOpts={{ validateOnEvents: { input: true } }} />
  </Form>
</Slide>

<Slide id="hidden" bind:activeId>
  <Form createForm={hiddenCreateForm}>
    <Entry entry={hiddenEntry} />
  </Form>
</Slide>
