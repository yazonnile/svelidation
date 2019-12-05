<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (params) => {
    return { entries: [{ type: 'string', ...params }] }
  };

  const {
    entries: [optionalEntry],
    createForm: optionalCreateForm
  } = getValidation(getConfig({ min: 2 }));

  const {
    entries: [matchEntry],
    createForm: matchCreateForm
  } = getValidation(getConfig({ match: /testmatch/ }));

  const {
    entries: [equalEntry],
    createForm: equalCreateForm
  } = getValidation(getConfig({ equal: 'hello' }));

  let activeId = 'optional';
</script>

<Slide id="optional" bind:activeId>
  <Form createForm={optionalCreateForm}>
    <Entry entry={optionalEntry} />
  </Form>
</Slide>

<Slide id="match" bind:activeId>
  <Form createForm={matchCreateForm}>
    <Entry entry={matchEntry} />
  </Form>
</Slide>

<Slide id="equal" bind:activeId>
  <Form createForm={equalCreateForm}>
    <Entry entry={equalEntry} />
  </Form>
</Slide>
