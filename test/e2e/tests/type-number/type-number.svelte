<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (params) => {
    return { entries: [{ type: 'number', ...params }] }
  };

  const {
    entries: [[ typeStore, typeInput ]],
    createForm: typeCreateForm
  } = getValidation(getConfig({ required: true }));

  const {
    entries: [[ minStore, minInput ]],
    createForm: minCreateForm
  } = getValidation(getConfig({ min: 22 }));

  const {
    entries: [[ maxValueStore, maxValueInput ]],
    createForm: maxValueCreateForm
  } = getValidation(getConfig({ max: 22 }));

  let activeId = 'type';
</script>

<Slide id="type" bind:activeId>
  <Form createForm={typeCreateForm}>
    <Entry store={typeStore} input={typeInput} />
  </Form>
</Slide>

<Slide id="min" bind:activeId>
  <Form createForm={minCreateForm}>
    <Entry store={minStore} input={minInput} />
  </Form>
</Slide>

<Slide id="max" bind:activeId>
  <Form createForm={maxValueCreateForm}>
    <Entry store={maxValueStore} input={maxValueInput} />
  </Form>
</Slide>
