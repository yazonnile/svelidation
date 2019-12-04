<script>
  import { getValidation, Entry } from 'helpers/helpers';

  const getConfig = (entriesCount) => {
    return { entries: Array(entriesCount).fill({ type: 'string', min: 4 }) }
  };

  const {
    entries: [
      [ visibleFirstStore, visibleFirstInput ],
      [ visibleSecondStore, visibleSecondInput ],
      [ visibleThirdStore ],
    ],
    validate, createEntry
  } = getValidation(getConfig(3));

  const [ forthStore ] = createEntry({ type: 'string', min: 4 });
</script>

<Entry store={visibleFirstStore} input={visibleFirstInput} />
<Entry store={visibleSecondStore} input={visibleSecondInput} />
<Entry store={visibleThirdStore} />
<Entry store={forthStore} />
<button id="primary" on:click={() => validate()}></button>
<button id="secondary" on:click={() => validate(true)}></button>
