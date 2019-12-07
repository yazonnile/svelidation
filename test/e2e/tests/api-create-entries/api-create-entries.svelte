<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (entriesCount) => {
    return { entries: Array(entriesCount).fill({ type: 'string', min: 4 }) }
  };

  const {
    entries: [
      arrayFirstEntry,
      arraySecondEntry,
    ],
    createForm: arrayCreateForm
  } = getValidation(getConfig(2));

  const {
    entries: [
      objectFirstEntry,
      objectSecondEntry,
    ],
    createForm: objectCreateForm
  } = getValidation(getConfig(2));

  let activeId = 'array';
</script>

<Slide id="array" bind:activeId>
  <Form createForm={arrayCreateForm}>
    <Entry entry={arrayFirstEntry} />
    <Entry entry={arraySecondEntry} />
  </Form>
</Slide>

<Slide id="object" bind:activeId>
  <Form createForm={objectCreateForm}>
    <Entry entry={objectFirstEntry} />
    <Entry entry={objectSecondEntry} />
  </Form>
</Slide>
