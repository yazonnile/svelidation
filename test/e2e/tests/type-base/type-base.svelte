<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (params) => {
    return { entries: [{ type: 'string', ...params }] }
  };

  const {
    entries: [[ optionalStore, optionalInput ]],
    createForm: optionalCreateForm
  } = getValidation(getConfig({ minLength: 2 }));

  const {
    entries: [[ matchStore, matchInput ]],
    createForm: matchCreateForm
  } = getValidation(getConfig({ match: /testmatch/ }));

  const {
    entries: [[ equalStore, equalInput ]],
    createForm: equalCreateForm
  } = getValidation(getConfig({ equal: 'hello' }));

  let activeId = 'optional';
</script>

<Slide id="optional" bind:activeId>
  <Form createForm={optionalCreateForm}>
    <Entry store={optionalStore} input={optionalInput} />
  </Form>
</Slide>

<Slide id="match" bind:activeId>
  <Form createForm={matchCreateForm}>
    <Entry store={matchStore} input={matchInput} />
  </Form>
</Slide>

<Slide id="equal" bind:activeId>
  <Form createForm={equalCreateForm}>
    <Entry store={equalStore} input={equalInput} />
  </Form>
</Slide>
