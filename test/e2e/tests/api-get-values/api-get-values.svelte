<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const {
    entries: [default0Entry, default1Entry],
    createForm: defaultCreateForm,
    getValues: defaultGetValues,
  } = getValidation({
    entries: [
      { type: 'string', value: 'value1' },
      { type: 'email', value: 'value2@aa.aa' }
    ]
  });

  const {
    entries: [id0Entry, id1Entry],
    getValues: idGetValues,
  } = getValidation({
    entries: [
      { type: 'string', id: 'login', value: 'value1' },
      { type: 'email', id: 'email', value: 'value2@aa.aa' }
    ], options: {
      includeAllEntries: true
    }
  });

  const {
    entries: [custom0Entry, custom1Entry],
    getValues: customGetValues,
  } = getValidation({
    entries: [
      { type: 'string', CUSTOM_KEY: 'login', value: 'value1' },
      { type: 'email', CUSTOM_KEY: 'email', value: 'value2@aa.aa' }
    ], options: {
      getValues: entries => {
        return entries.map(({ value }) => {
          return { value };
        });
      },
      includeAllEntries: true
    }
  });

  let activeId = 'default';

  let result = [];
  const onSuccess = () => {
    let values = defaultGetValues();
    for (let value of values.values()) {
      result.push(value);
    }
    result = [...result];
  }
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm} createFormParams={{ onSuccess }}>
    <Entry entry={default0Entry} />
    <Entry entry={default1Entry} />
  </Form>

  {#each result as value}
    <div class="result">{value}</div>
  {/each}
</Slide>

<Slide id="id" bind:activeId>
  {#each Object.values(Object.fromEntries(idGetValues())) as value}
    <div class="result">{value}</div>
  {/each}
</Slide>

<Slide id="custom" bind:activeId>
  {#each Object.values(customGetValues()) as { value }}
    <div class="result">{value}</div>
  {/each}
</Slide>

