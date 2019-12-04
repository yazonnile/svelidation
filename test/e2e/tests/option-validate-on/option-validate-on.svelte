<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (options) => {
    return { entries: [{ type: 'string', min: 4 }], options }
  };

  const {
    entries: [[ defaultStore, defaultInput ]],
    createForm: defaultCreateForm
  } = getValidation(getConfig());

  const {
    entries: [[ emptyStore, emptyInput ]],
    createForm: emptyCreateForm
  } = getValidation(getConfig({ validateOn: [] }));

  const {
    entries: [[ blurStore, blurInput ]],
    createForm: blurCreateForm
  } = getValidation(getConfig({ validateOn: ['blur'] }));

  let activeId = 'default';
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <Entry store={defaultStore} input={defaultInput} />
  </Form>
</Slide>

<Slide id="empty" bind:activeId>
  <Form createForm={emptyCreateForm}>
    <Entry store={emptyStore} input={emptyInput} />
  </Form>
</Slide>

<Slide id="blur" bind:activeId>
  <Form createForm={blurCreateForm}>
    <Entry store={blurStore} input={blurInput} />
  </Form>
</Slide>
