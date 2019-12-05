<script>
  import { getValidation, Entry } from 'helpers/helpers';

  const getConfig = (entriesCount) => {
    return { entries: Array(entriesCount).fill({ type: 'string', min: 4 }) }
  };

  const {
    entries: [
      visibleFirstEntry,
      visibleSecondEntry,
      visibleThirdEntry,
    ],
    validate, createEntry
  } = getValidation(getConfig(3));

  const forthEntry = createEntry({ type: 'string', min: 4 });
</script>

<Entry entry={visibleFirstEntry} />
<Entry entry={visibleSecondEntry} />
<Entry entry={visibleThirdEntry} noInput />
<Entry entry={forthEntry} noInput />
<button id="primary" on:click={() => validate()}></button>
<button id="secondary" on:click={() => validate(true)}></button>
