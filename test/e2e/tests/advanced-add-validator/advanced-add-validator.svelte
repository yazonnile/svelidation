<script>
  import { getValidation, Entry, Form } from 'helpers/helpers';
  import { addValidator, BaseType } from 'dist';

  addValidator('xxxType', class extends BaseType {
    typeValidation() {
      return super.typeValidation(/^AAA$/);
    }
  });

  const {
    entries: [
      [ store, input ]
    ],
    createForm
  } = getValidation({ entries: [{ type: 'xxxType' }] });
</script>

<Form {createForm}>
  <Entry {store} {input} />
</Form>
