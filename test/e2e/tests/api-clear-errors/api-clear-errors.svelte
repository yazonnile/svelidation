<script>
  import { getValidation, Entry, Form } from 'helpers/helpers';

  const getConfig = (entriesCount) => {
    return { entries: Array(entriesCount).fill({ type: 'string', min: 4 }) }
  };

  const {
    entries: [
      visibleFirstEntry,
      visibleSecondEntry,
      visibleThirdEntry,
      forthEntry,
    ],
    createForm, clearErrors, validateValueStore
  } = getValidation(getConfig(4));

  validateValueStore(forthEntry[1]);
  let errors = forthEntry[0];
</script>

<Form {createForm}>
  <Entry entry={visibleFirstEntry} />
  <Entry entry={visibleSecondEntry} />
  <Entry entry={visibleThirdEntry} noInput />
</Form>
{#if $errors.length}
  <p id="forth-error"></p>
{/if}
<button id="primary" on:click={() => clearErrors()}></button>
<button id="secondary" on:click={() => clearErrors(true)}></button>
