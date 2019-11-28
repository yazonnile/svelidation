<script>
  import { getValidation, Entry } from 'helpers/helpers';

  const getConfig = (entriesCount) => {
    return { entries: Array(entriesCount).fill({ type: 'string', minLength: 4 }) }
  };

  const {
    entries: [
      [ visibleFirstStore, visibleFirstInput ],
      [ visibleSecondStore, visibleSecondInput ],
      [ visibleThirdStore ],
    ],
    validateAll, createEntry
  } = getValidation(getConfig(3));

  const [ forthStore ] = createEntry({ type: 'string', minLength: 4 });
</script>

<Entry store={visibleFirstStore} input={visibleFirstInput} />
<Entry store={visibleSecondStore} input={visibleSecondInput} />
<Entry store={visibleThirdStore} />
<Entry store={forthStore} />
<button id="main-action" on:click={validateAll}></button>
