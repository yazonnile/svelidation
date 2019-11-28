<script>
  import { getValidation, Entry } from 'helpers/helpers';

  const getConfig = (entriesCount) => {
    return { entries: Array(entriesCount).fill({ type: 'string', minLength: 4 }) }
  };

  const {
    entries: [
      [ visibleSecondStore ],
    ],
    validateStore
  } = getValidation(getConfig(2));
</script>

<Entry store={visibleSecondStore} />
<button id="main-action" on:click={() => validateStore(visibleSecondStore)}></button>
