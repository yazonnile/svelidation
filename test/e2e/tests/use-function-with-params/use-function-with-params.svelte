<script>
  import { getValidation, Form, Entry } from 'helpers/helpers';

  const {
    entries: [entry1, entry2],
    createForm
  } = getValidation({ entries: [{ type: 'string', min: 4 }, { type: 'string', min: 4 }] });

  const inputOpts = {
    validateOnEvents: { input: true }
  }
</script>

<Form {createForm}>
  <Entry entry={entry1} />
  <Entry entry={entry2} {inputOpts} />
</Form>
