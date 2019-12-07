<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (params = {}) => {
    return { entries: [{ type: 'boolean', ...params }] }
  };

  const {
    entries: [defaultEntry],
    createForm: defaultCreateForm
  } = getValidation(getConfig());

  const {
    entries: [requiredEntry],
    createForm: requiredCreateForm
  } = getValidation(getConfig({ required: true }));

  let activeId = 'default';
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <Entry type="boolean" entry={defaultEntry} />
  </Form>
</Slide>

<Slide id="required" bind:activeId>
  <Form createForm={requiredCreateForm}>
    <Entry type="boolean" entry={requiredEntry} />
  </Form>
</Slide>
