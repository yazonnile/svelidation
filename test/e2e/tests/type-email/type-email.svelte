<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = () => {
    return { entries: [{ type: 'email', required: true }] }
  };

  const {
    entries: [entry],
    createForm: typeCreateForm
  } = getValidation(getConfig());

  let activeId = 'type';
</script>

<Slide id="type" bind:activeId>
  <Form createForm={typeCreateForm}>
    <Entry {entry} />
  </Form>
</Slide>
