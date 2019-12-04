<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (params) => {
    return { entries: [{ type: 'string', ...params }] }
  };

  const {
    entries: [[ minStore, minInput ]],
    createForm: minCreateForm
  } = getValidation(getConfig({ min: 2 }));

  const {
    entries: [[ maxStore, maxInput ]],
    createForm: maxCreateForm
  } = getValidation(getConfig({ max: 6 }));

  let activeId = 'min';
</script>

<Slide id="min" bind:activeId>
  <Form createForm={minCreateForm}>
    <Entry store={minStore} input={minInput} />
  </Form>
</Slide>

<Slide id="max" bind:activeId>
  <Form createForm={maxCreateForm}>
    <Entry store={maxStore} input={maxInput} />
  </Form>
</Slide>
