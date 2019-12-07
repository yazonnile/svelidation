<script>
  import Button from 'docs/ui/button.svelte';
  import Toggle from 'docs/builder/components/toggle.svelte';
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  let initialState = true;
  let selectedType = '';
  let selectedRules = {
    min: { checked: false, value: '' },
    max: { checked: false, value: '' },
    between: { checked: false, value: '' },
    includes: { checked: false, value: '' },
    equal: { checked: false, value: '' },
    match: { checked: false, value: '' },
    required: { checked: false },
  };

  const onTypeSelect = (type) => {
    selectedType = type;
  };

  const onSave = () => {
    console.log(JSON.stringify(selectedRules, null, '  '));
  }
</script>

{#if initialState}
  <Button on:click={() => (initialState = false)}>add field</Button>
{:else}
  <div class="steps">
    <div class="step">
      {#if !selectedType}
        <div class="inner" transition:fly|local={{delay: 500, duration: 500, x: 100, opacity: 0, easing: quintOut}}>
          <button on:click={() => (selectedType = 'string')}>string</button>
          <button on:click={() => (selectedType = 'email')}>email</button>
          <button on:click={() => (selectedType = 'number')}>number</button>
          <button on:click={() => (selectedType = 'boolean')}>boolean</button>
          <button on:click={() => (selectedType = 'array')}>array</button>
        </div>
      {/if}
    </div>
    <div class="step">
      {#if selectedType}
        <div class="inner" transition:fly|local={{delay: 500, duration: 500, x: 100, opacity: 0, easing: quintOut}}>
          {#if ['string', 'number', 'array'].includes(selectedType)}
            <div class="rule" class:checked={selectedRules.min.checked} on:click={() => (selectedRules.min.checked = !selectedRules.min.checked)}>
              <Toggle id="min" bind:checked={selectedRules.min.checked} />
              <label for="min" class="text">min</label>
              <input type="number" disabled={!selectedRules.min.checked} bind:value={selectedRules.min.value} on:click|stopPropagation />
            </div>
          {/if}
          {#if ['string', 'number', 'array'].includes(selectedType)}
            <div class="rule" class:checked={selectedRules.max.checked} on:click={() => (selectedRules.max.checked = !selectedRules.max.checked)}>
              <Toggle id="max" bind:checked={selectedRules.max.checked} />
              <label for="max" class="text">max</label>
              <input type="number" disabled={!selectedRules.max.checked} bind:value={selectedRules.max.value} on:click|stopPropagation />
            </div>
          {/if}
          {#if ['string', 'number'].includes(selectedType)}
            <div class="rule" class:checked={selectedRules.between.checked} on:click={() => (selectedRules.between.checked = !selectedRules.between.checked)}>
              <Toggle id="between" bind:checked={selectedRules.between.checked} />
              <label for="between" class="text">between</label>
              <input type="text" disabled={!selectedRules.between.checked} bind:value={selectedRules.between.value} on:click|stopPropagation />
            </div>
          {/if}
          {#if ['array'].includes(selectedType)}
            <div class="rule" class:checked={selectedRules.includes.checked} on:click={() => (selectedRules.includes.checked = !selectedRules.includes.checked)}>
              <Toggle id="includes" bind:checked={selectedRules.includes.checked} />
              <label for="includes" class="text">includes</label>
              <input type="text" disabled={!selectedRules.includes.checked} bind:value={selectedRules.includes.value} on:click|stopPropagation />
            </div>
          {/if}
          <div class="rule" class:checked={selectedRules.equal.checked} on:click={() => (selectedRules.equal.checked = !selectedRules.equal.checked)}>
            <Toggle id="equal" bind:checked={selectedRules.equal.checked} />
            <label for="equal" class="text">equal</label>
            <input type="text" disabled={!selectedRules.equal.checked} bind:value={selectedRules.equal.value} on:click|stopPropagation />
          </div>
          <div class="rule" class:checked={selectedRules.match.checked} on:click={() => (selectedRules.match.checked = !selectedRules.match.checked)}>
            <Toggle id="match" bind:checked={selectedRules.match.checked} />
            <label for="match" class="text">match</label>
            <input type="text" disabled={!selectedRules.match.checked} bind:value={selectedRules.match.value} on:click|stopPropagation />
          </div>
          <div class="rule" class:checked={selectedRules.required.checked} on:click={() => (selectedRules.required.checked = !selectedRules.required.checked)}>
            <Toggle id="required" bind:checked={selectedRules.required.checked} />
            <label for="required" class="text">required</label>
          </div>
          <button on:click={onSave} class="active">Create</button>
          <button on:click={() => (selectedType = '')} class="cancel">back</button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .steps {
    display: flex;
    overflow: hidden;
  }

  .step {
    flex: 1;
  }

  .step:first-child {
    margin-right: 10px;
  }

  .step button,
  .rule {
    background: var(--mainColorLight);
    border: 0;
    border-radius: 3px;
    box-shadow: 0 0 5px var(--grey);
    color: #333;
    display: block;
    font-size: 16px;
    line-height: 20px;
    margin-top: 10px;
    outline: 0;
    padding: 10px;
    text-transform: uppercase;
    width: 100%;
  }

  .step button {
    cursor: pointer;
  }

  .step button.active {
    background: var(--mainColor);
    color: #fff;
  }

  .step button.cancel {
    background: var(--greyLight);
    color: #333;
  }

  .rule {
    background: var(--greyVeryLight);
    cursor: pointer;
  }

  .text {
    margin-left: 10px;
  }

  .rule.checked {
    background: var(--mainColorLight);
  }

  .rule input {
    border: 1px solid var(--grey);
    border-radius: 3px;
    float: right;
    font-size: 14px;
    height: 20px;
    line-height: 18px;
    outline: 0;
    padding: 0 3px;
    text-align: right;
    width: 100px;
  }

  .rule input:disabled {
    background: var(--greyLight);
    color: var(--grey);
    cursor: pointer;
  }
</style>
