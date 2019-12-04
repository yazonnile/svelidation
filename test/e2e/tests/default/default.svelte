<script>
  import { getValidation, Form, Entry } from 'helpers/helpers';

  const {
    entries: [
      [ store, input ]
    ],
    createForm
  } = getValidation({
    entries: [{
      type: 'string',
      min: 4,
      max: 6
    }]
  });
</script>

<Form {createForm}>
  <Entry {store} {input} />
</Form>
