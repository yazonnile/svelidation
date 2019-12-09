<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (options) => {
    return { entries: [
      { type: 'email' },
      { type: 'email', required: true },
      { type: 'email', optional: true },
      { type: 'string', min: 2 },
      { type: 'string', min: 2, required: true, },
      { type: 'string', min: 2, optional: true, }
    ], options }
  };

  const {
    entries: [requiredEntry1, requiredEntry2, requiredEntry3, requiredEntry4, requiredEntry5, requiredEntry6 ],
    createForm: requiredCreateForm
  } = getValidation(getConfig({ presence: 'required' }));

  const {
    entries: [optionalEntry1, optionalEntry2, optionalEntry3, optionalEntry4, optionalEntry5, optionalEntry6 ],
    createForm: optionalCreateForm
  } = getValidation(getConfig({ presence: 'optional' }));

  const {
    entries: [mix1Entry, mix2Entry],
    createForm: mixCreateForm
  } = getValidation({
    entries: [{ type: 'email' }, { type: 'email', optional: true }],
    options: { presence: 'required' }
  });

  let activeId = 'default';
</script>

<Slide id="required" bind:activeId>
  <Form createForm={requiredCreateForm}>
    <Entry entry={requiredEntry1} />
    <Entry entry={requiredEntry2} />
    <Entry entry={requiredEntry3} />
    <Entry entry={requiredEntry4} />
    <Entry entry={requiredEntry5} />
    <Entry entry={requiredEntry6} />
  </Form>
</Slide>

<Slide id="optional" bind:activeId>
  <Form createForm={optionalCreateForm}>
    <Entry entry={optionalEntry1} />
    <Entry entry={optionalEntry2} />
    <Entry entry={optionalEntry3} />
    <Entry entry={optionalEntry4} />
    <Entry entry={optionalEntry5} />
    <Entry entry={optionalEntry6} />
  </Form>
</Slide>

<Slide id="mix" bind:activeId>
  <Form createForm={mixCreateForm}>
    <Entry entry={mix1Entry} />
    <Entry entry={mix2Entry} />
  </Form>
</Slide>
