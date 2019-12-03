<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (options) => {
    return { entries: [{ type: 'email' }], options }
  };

  const {
    entries: [[ defaultStore, defaultInput ]],
    createForm: defaultCreateForm
  } = getValidation(getConfig());

  const {
    entries: [[ requiredStore, requiredInput ]],
    createForm: requiredCreateForm
  } = getValidation(getConfig({ presence: 'required' }));

  const {
    entries: [[ optionalStore, optionalInput ]],
    createForm: optionalCreateForm
  } = getValidation(getConfig({ presence: 'optional' }));

  const {
    entries: [[ mix1Store, mix1Input ], [ mix2Store, mix2Input ]],
    createForm: mixCreateForm
  } = getValidation({
    entries: [{ type: 'email' }, { type: 'email', optional: true }],
    options: { presence: 'required' }
  });

  let activeId = 'default';
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <Entry store={defaultStore} input={defaultInput} />
  </Form>
</Slide>

<Slide id="required" bind:activeId>
  <Form createForm={requiredCreateForm}>
    <Entry store={requiredStore} input={requiredInput} />
  </Form>
</Slide>

<Slide id="optional" bind:activeId>
  <Form createForm={optionalCreateForm}>
    <Entry store={optionalStore} input={optionalInput} />
  </Form>
</Slide>

<Slide id="mix" bind:activeId>
  <Form createForm={mixCreateForm}>
    <Entry store={mix1Store} input={mix1Input} />
    <Entry store={mix2Store} input={mix2Input} />
  </Form>
</Slide>
