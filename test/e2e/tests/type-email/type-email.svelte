<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = () => {
    return { entries: [{ type: 'email' }] }
  };

  const {
    entries: [[ typeStore, typeInput ]],
    createForm: typeCreateForm
  } = getValidation(getConfig());

  let activeId = 'type';
</script>

<Slide id="type" bind:activeId>
  <Form createForm={typeCreateForm}>
    <Entry store={typeStore} input={typeInput} />
  </Form>
</Slide>
