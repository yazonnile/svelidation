<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (options) => {
    return { entries: [{ type: 'string', minLength: 4 }], options }
  };

  const {
    entries: [[ defaultStore, defaultInput ]],
    createForm: defaultCreateForm
  } = getValidation(getConfig());

  const {
    entries: [[ neverStore, neverInput ]],
    createForm: neverCreateForm
  } = getValidation(getConfig({ inputValidationPhase: PhaseEnum.never }));

  const {
    entries: [[ alwaysStore, alwaysInput ]],
    createForm: alwaysCreateForm
  } = getValidation(getConfig({ inputValidationPhase: PhaseEnum.always }));

  let activeId = 'default';
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <Entry store={defaultStore} input={defaultInput} />
  </Form>
</Slide>

<Slide id="never" bind:activeId>
  <Form createForm={neverCreateForm}>
    <Entry store={neverStore} input={neverInput} />
  </Form>
</Slide>

<Slide id="always" bind:activeId>
  <Form createForm={alwaysCreateForm}>
    <Entry store={alwaysStore} input={alwaysInput} />
  </Form>
</Slide>
