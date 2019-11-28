<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (entriesCount) => {
    return { entries: Array(entriesCount).fill({ type: 'string', minLength: 4 }) }
  };

  const {
    entries: [
      [ noUseStore ],
      [ useStore, useInput ]
    ],
    createForm: noUseCreateForm
  } = getValidation(getConfig(2));

  const {
    entries: [[ hiddenStore, hiddenInput ]],
    createForm: hiddenCreateForm
  } = getValidation(getConfig(1));

  let activeId = 'use';
</script>

<Slide id="use" bind:activeId>
  <Form createForm={noUseCreateForm}>
    <Entry store={noUseStore} />
    <Entry store={useStore} input={useInput} />
  </Form>
</Slide>

<Slide id="hidden" bind:activeId>
  <Form createForm={hiddenCreateForm}>
    <Entry store={hiddenStore} input={hiddenInput} />
  </Form>
</Slide>
