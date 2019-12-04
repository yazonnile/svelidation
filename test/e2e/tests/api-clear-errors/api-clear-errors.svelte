<script>
  import { getValidation, Entry, Form } from 'helpers/helpers';

  const getConfig = (entriesCount) => {
    return { entries: Array(entriesCount).fill({ type: 'string', min: 4 }) }
  };

  const {
    entries: [
      [ visibleFirstStore, visibleFirstInput ],
      [ visibleSecondStore, visibleSecondInput ],
      [ visibleThirdStore ],
      [ forthStore ],
    ],
    createForm, clearErrors, validateStore
  } = getValidation(getConfig(4));

  validateStore(forthStore);
</script>

<Form {createForm}>
  <Entry store={visibleFirstStore} input={visibleFirstInput} />
  <Entry store={visibleSecondStore} input={visibleSecondInput} />
  <Entry store={visibleThirdStore} />
</Form>
{#if $forthStore.errors.length}
  <p id="forth-error"></p>
{/if}
<button id="primary" on:click={() => clearErrors()}></button>
<button id="secondary" on:click={() => clearErrors(true)}></button>
