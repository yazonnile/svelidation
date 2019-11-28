<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (params) => {
    return { entries: [{ type: 'string', ...params }] }
  };

  const {
    entries: [[ minLengthStore, minLengthInput ]],
    createForm: minLengthCreateForm
  } = getValidation(getConfig({ minLength: 2 }));

  const {
    entries: [[ maxLengthStore, maxLengthInput ]],
    createForm: maxLengthCreateForm
  } = getValidation(getConfig({ maxLength: 6 }));

  let activeId = 'minLength';
</script>

<Slide id="minLength" bind:activeId>
  <Form createForm={minLengthCreateForm}>
    <Entry store={minLengthStore} input={minLengthInput} />
  </Form>
</Slide>

<Slide id="maxLength" bind:activeId>
  <Form createForm={maxLengthCreateForm}>
    <Entry store={maxLengthStore} input={maxLengthInput} />
  </Form>
</Slide>
