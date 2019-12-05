<script>
  import { getValidation, Form, Entry } from 'helpers/helpers';

  const {
    entries: [[firstErrors, firstValue, firstInput], second],
    createForm: minCreateForm
  } = getValidation({
    entries: [{
      type: 'string',
      required: true
    }, {
      type: 'string',
      equal: (value) => {
        return value && value === $firstValue;
      }
    }]
  });

  let activeId = 'equal';
</script>

<Form createForm={minCreateForm}>
  <Entry entry={[firstErrors, firstValue, firstInput]} />
  <Entry entry={second} />
</Form>
