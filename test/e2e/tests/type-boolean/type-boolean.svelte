<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (params = {}) => {
    return { entries: [{ type: 'boolean', ...params }] }
  };

  const {
    entries: [[ defaultStore, defaultInput ]],
    createForm: defaultCreateForm
  } = getValidation(getConfig());

  const {
    entries: [[ requiredStore, requiredInput ]],
    createForm: requiredCreateForm
  } = getValidation(getConfig({ required: true }));

  let activeId = 'default';
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <Entry type="boolean" store={defaultStore} input={defaultInput} />
  </Form>
</Slide>

<Slide id="required" bind:activeId>
  <Form createForm={requiredCreateForm}>
    <Entry type="boolean" store={requiredStore} input={requiredInput} />
  </Form>
</Slide>
