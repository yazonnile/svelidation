<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (params) => {
    return { entries: [{ type: 'number', ...params }] }
  };

  const {
    entries: [[ typeStore, typeInput ]],
    createForm: typeCreateForm
  } = getValidation(getConfig());

  const {
    entries: [[ minValueStore, minValueInput ]],
    createForm: minValueCreateForm
  } = getValidation(getConfig({ minValue: 22 }));

  const {
    entries: [[ maxValueStore, maxValueInput ]],
    createForm: maxValueCreateForm
  } = getValidation(getConfig({ maxValue: 22 }));

  let activeId = 'type';
</script>

<Slide id="type" bind:activeId>
  <Form createForm={typeCreateForm}>
    <Entry store={typeStore} input={typeInput} />
  </Form>
</Slide>

<Slide id="minValue" bind:activeId>
  <Form createForm={minValueCreateForm}>
    <Entry store={minValueStore} input={minValueInput} />
  </Form>
</Slide>

<Slide id="maxValue" bind:activeId>
  <Form createForm={maxValueCreateForm}>
    <Entry store={maxValueStore} input={maxValueInput} />
  </Form>
</Slide>
