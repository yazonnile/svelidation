<script>
  import { Entry, Form } from 'helpers/helpers';
  import Svelidation, { StringType } from 'dist';

  StringType.prototype.typeValidation = function() {
    return this.getValue().length >= 4;
  };

  const validation = new Svelidation();
  const [ store, input ] = validation.createEntry({ type: 'string' });
  const { createForm } = validation;
</script>

<Form {createForm}>
  <Entry {store} {input} />
</Form>
