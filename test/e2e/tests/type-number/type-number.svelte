<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (params) => {
    return { entries: [{ type: 'number', ...params }] }
  };

  const {
    entries: [typeEntry],
    createForm: typeCreateForm
  } = getValidation(getConfig({ required: true }));

  const {
    entries: [minEntry],
    createForm: minCreateForm
  } = getValidation(getConfig({ min: 22 }));

  const {
    entries: [maxEntry],
    createForm: maxCreateForm
  } = getValidation(getConfig({ max: 22 }));

  let activeId = 'type';
</script>

<Slide id="type" bind:activeId>
  <Form createForm={typeCreateForm}>
    <Entry entry={typeEntry} />
  </Form>
</Slide>

<Slide id="min" bind:activeId>
  <Form createForm={minCreateForm}>
    <Entry entry={minEntry} />
  </Form>
</Slide>

<Slide id="max" bind:activeId>
  <Form createForm={maxCreateForm}>
    <Entry entry={maxEntry} />
  </Form>
</Slide>
