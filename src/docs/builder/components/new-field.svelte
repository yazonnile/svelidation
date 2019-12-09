<script>
  import Button from 'docs/ui/button.svelte';
  import Rule from './new-field-rule.svelte';
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { createEventDispatcher } from 'svelte';

  let initialState = true;
  let selectedType = '';
  let selectedRules = {
    min: { checked: false, value: '' },
    max: { checked: false, value: '' },
    between: { checked: false, value: ['', ''] },
    includes: { checked: false, value: '' },
    equal: { checked: false, value: '' },
    match: { checked: false, value: '' },
    required: { checked: false },
    optional: { checked: false },
  };

  const onChangeType = () => {
    selectedType = '';
    selectedRules = Object.keys(selectedRules).reduce((result, ruleName) => {
      const rule = selectedRules[ruleName];

      result[ruleName] = {
        checked: false
      };

      if ('value' in rule) {
        result[ruleName].value = Array.isArray(rule.value) ? ['', ''] : '';
      }

      return result;
    }, {});
  };

  const isDefined = (v) => typeof v === 'string' ? v.length : typeof v !== 'undefined';
  const dispatch = createEventDispatcher();
  const onSave = () => {
    const result = Object.keys(selectedRules).reduce((result, ruleName) => {
      const rule = selectedRules[ruleName];

      if (!rule.checked) {
        return result;
      }

      if (!('value' in rule)) {
        result[ruleName] = true;
        return result;
      } else if (ruleName === 'equal' && selectedType === 'array') {
        result[ruleName] = rule.value.split(',').map(eval);
      } else if (ruleName === 'equal' && selectedType === 'number') {
        result[ruleName] = parseFloat(rule.value);
      } else if (Array.isArray(rule.value) ? (isDefined(rule.value[0]) && isDefined(rule.value[1])) : isDefined(rule.value)) {
        result[ruleName] = rule.value;
      }

      return result;
    }, {});

    if (!Object.keys(result).length) {
      return;
    }

    result.type = selectedType;
    result.value = selectedType === 'boolean' ? false : (selectedType === 'array' ? [] : '');
    dispatch('newField', result);
    onCancel();
  };

  const onCancel = () => {
    initialState = true;
    onChangeType();
  };
</script>

{#if initialState}
  <slot />
  <Button on:click={() => (initialState = false)}>add field</Button>
{:else}
  <div class="type">
    <select bind:value={selectedType} disabled={selectedType}>
      <option value={''} disabled>First, select type</option>
      <option value="string">string</option>
      <option value="email">email</option>
      <option value="number">number</option>
      <option value="boolean">boolean</option>
      <option value="array">array</option>
    </select>
    {#if selectedType}
      <div class="button">
        <Button on:click={onChangeType}>change</Button>
      </div>
    {/if}
  </div>

  {#if selectedType}
    <div class="rules" transition:slide|local={{duration: 500, easing: quintOut}}>
      <Rule
        type="number"
        bind:model={selectedRules.min}
        disabled={!['string', 'number', 'array'].includes(selectedType)}
        text="min"
      />
      <Rule
        type="number"
        bind:model={selectedRules.max}
        disabled={!['string', 'number', 'array'].includes(selectedType)}
        text="max"
      />
      <Rule
        type="number"
        bind:model={selectedRules.between}
        disabled={!['string', 'number'].includes(selectedType)}
        text="between"
      />
      <Rule
        bind:model={selectedRules.includes}
        disabled={selectedType !== 'array'}
        text="includes"
      />
      <Rule
        bind:model={selectedRules.equal}
        disabled={selectedType === 'boolean'}
        text="equal"
        placeholder={selectedType === 'array' && '1,2,3'}
      />
      <Rule
        bind:model={selectedRules.match}
        disabled={selectedType === 'boolean'}
        text="match"
        placeholder="[A-Za-z]{1,4}..."
      />
      <Rule
        bind:model={selectedRules.required}
        disabled={selectedRules.optional.checked}
        text="required"
      />
      <Rule
        bind:model={selectedRules.optional}
        disabled={selectedRules.required.checked}
        text="optional"
      />
    </div>
  {/if}

  {#if selectedType}
    <Button on:click={onSave}>Create</Button>
    <Button on:click={onCancel}>Cancel</Button>
  {/if}
{/if}

<style>
  .type {
    display: flex;
    margin-bottom: 10px;
    overflow: hidden;
  }

  .type:only-child {
    margin-bottom: 0;
  }

  .type select {
    border: 1px solid var(--grey);
    border-radius: 3px;
    font-size: 16px;
    height: 40px;
    outline: 0;
    padding: 0 3px;
  }

  .type .button {
    flex: 1;
    margin-left: 10px;
  }

  .type select:disabled {
    background: #fff;
    color: inherit;
  }

  .type select:disabled + .button {
    margin-right: 0;
    transition-delay: .5s;
  }

  .rules {
    display: flex;
    flex-wrap: wrap;
    width: calc(100% + 10px);
  }
</style>
