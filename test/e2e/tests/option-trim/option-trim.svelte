<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (options) => {
    return { entries: [{ type: 'string', min: 5 }], options }
  };

  const {
    entries: [[ defaultStore, defaultInput ]],
    createForm: defaultCreateForm
  } = getValidation(getConfig());

  const {
    entries: [[ trueStore, trueInput ]],
    createForm: trueCreateForm
  } = getValidation(getConfig({ trim: true }));

  const {
    entries: [[ falseStore, falseInput ]],
    createForm: falseCreateForm
  } = getValidation(getConfig({ trim: false }));

  const {
    entries: [[ mix1Store, mix1Input ], [ mix2Store, mix2Input ]],
    createForm: mixCreateForm
  } = getValidation({
    entries: [{ type: 'string', min: 5 }, { type: 'string', trim: false, min: 5}],
    options: { trim: true }
  });

  let activeId = 'default';
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <Entry store={defaultStore} input={defaultInput} />
  </Form>
</Slide>

<Slide id="true" bind:activeId>
  <Form createForm={trueCreateForm}>
    <Entry store={trueStore} input={trueInput} />
  </Form>
</Slide>

<Slide id="false" bind:activeId>
  <Form createForm={falseCreateForm}>
    <Entry store={falseStore} input={falseInput} />
  </Form>
</Slide>

<Slide id="mix" bind:activeId>
  <Form createForm={mixCreateForm}>
    <Entry store={mix1Store} input={mix1Input} />
    <Entry store={mix2Store} input={mix2Input} />
  </Form>
</Slide>
