<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (entriesCount) => {
    return { entries: Array(entriesCount).fill({ type: 'string', minLength: 4 }) }
  };

  const {
    entries: [
      [ arrayFirstStore, arrayFirstInput ],
      [ arraySecondStore, arraySecondInput ],
    ],
    createForm: arrayCreateForm
  } = getValidation(getConfig(2));

  const {
    entries: [
      [ objectFirstStore, objectFirstInput ],
      [ objectSecondStore, objectSecondInput ],
    ],
    createForm: objectCreateForm
  } = getValidation(getConfig(2));

  let activeId = 'array';
</script>

<Slide id="array" bind:activeId>
  <Form createForm={arrayCreateForm}>
    <Entry store={arrayFirstStore} input={arrayFirstInput} />
    <Entry store={arraySecondStore} input={arraySecondInput} />
  </Form>
</Slide>

<Slide id="object" bind:activeId>
  <Form createForm={objectCreateForm}>
    <Entry store={objectFirstStore} input={objectFirstInput} />
    <Entry store={objectSecondStore} input={objectSecondInput} />
  </Form>
</Slide>
