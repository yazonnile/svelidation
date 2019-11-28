<script>
  import { getValidation, Entry, Form } from 'helpers/helpers';

  const getConfig = (entriesCount) => {
    return { entries: Array(entriesCount).fill({ type: 'string', minLength: 4 }) }
  };

  const {
    entries: [
      [ visibleFirstStore, visibleFirstInput ],
      [ visibleSecondStore, visibleSecondInput ],
      [ visibleThirdStore ],
    ],
    createForm, clearErrors
  } = getValidation(getConfig(3));
</script>

<Form {createForm}>
  <Entry store={visibleFirstStore} input={visibleFirstInput} />
  <Entry store={visibleSecondStore} input={visibleSecondInput} />
  <Entry store={visibleThirdStore} />
</Form>
<button id="main-action" on:click={clearErrors}></button>
