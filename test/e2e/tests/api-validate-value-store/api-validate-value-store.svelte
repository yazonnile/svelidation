<script>
  import { getValidation, Entry } from 'helpers/helpers';

  const getConfig = (entriesCount) => {
    return { entries: Array(entriesCount).fill({ type: 'string', min: 4 }) }
  };

  const {
    entries: [
      entry,
    ],
    validateValueStore
  } = getValidation(getConfig(2));
</script>

<Entry {entry} noInput />
<button id="primary" on:click={() => validateValueStore(entry[1])}></button>
