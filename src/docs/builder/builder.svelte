<script>
  import createValidation from 'lib/lib';
  import NewField from 'docs/builder/components/new-field.svelte';
  import Widget from 'docs/ui/widget.svelte';
  import Button from 'docs/ui/button.svelte';
  import Code from 'docs/ui/code.svelte';
  import Field from 'docs/builder/components/field.svelte';
  import Reset from 'docs/ui/reset.svelte';
  import FormOptions from 'docs/builder/components/form-options.svelte';
  import { getFormCode } from 'docs/builder/lib/get-code/get-code';

  let id = 0;
  let fields = [{
    id: id++,
    params: {
      type: 'string',
      value: '',
      min: 2
    }
  }];

  const onNewField = ({ detail: params }) => {
    fields = [
      ...fields,
      { id: id++, params }
    ];
  };

  const removeRow = (rowId) => {
    fields = fields.filter(({ id }) => (id !== rowId));
  };

  let formOptions = {
    validateOnEvents: { change: true, input: false, blur: false },
    clearErrorsOnEvents: { reset: true, focus: false },
    listenInputEvents: 2,
    presence: 'optional',
    trim: false,
    includeAllEntries: false
  };
  let formOptionsMode = false;
  let formCode = getFormCode(formOptions);
  let formReset = 0;
  const onSave = ({ detail }) => {
    formOptionsMode = false;
    formOptions = detail;

    let newCode = getFormCode(formOptions);

    if (newCode !== formCode) {
      formCode = newCode;
      const validation = createValidation({ ...formOptions });
      createEntry = validation.createEntry;
      createForm = validation.createForm;
      validateValueStore = validation.validateValueStore;
      formReset++;
    }
  };

  let { createEntry, createForm, validateValueStore } = createValidation(formOptions);
</script>

<Widget>
  <Reset n={formReset}>
    <form use:createForm novalidate on:submit|preventDefault>
    <div class="row">
      {#if formOptionsMode}
        <FormOptions
          {formOptions}
          on:save={onSave}
          on:cancel={() => (formOptionsMode = false)}
        />
      {:else}
        <div class="code">
          <Code code={formCode} builderMode />
        </div>
        <Button on:click={() => (formOptionsMode = true)}>edit form options</Button>
      {/if}
    </div>

    {#each fields as { id, params } (id)}
      <div class="row field-row remove-row">
        <Field {params} {createEntry} {id} {validateValueStore}>
          <button on:click|preventDefault={() => removeRow(id)}>remove</button>
        </Field>
      </div>
    {/each}

    <div class="row padding">
      <NewField on:newField={onNewField}>
        {#if fields.length}
          <Button type="submit">Validate all</Button>
        {/if}
      </NewField>
    </div>
  </form>
  </Reset>
</Widget>

<style>
  .row {
    border-bottom: 1px solid var(--grey);
    margin: 0 -10px;
  }

  .row:first-child {
    padding: 0 10px 10px;
  }

  .row:last-child {
    border: 0;
    margin: 0;
    padding-top: 10px;
  }

  .remove-row :global(button) {
    background: none;
    border: 0;
    cursor: pointer;
    color: var(--redColor);
    font-size: 12px;
    line-height: 19px;
    padding: 2px 5px;
    text-transform: uppercase;
  }

  .remove-row :global(button:hover) {
    background: var(--redColor);
    color: #fff;
  }

  .form-params {
    display: flex;
    flex-wrap: wrap;
    width: calc(100% + 10px);
  }

  .code {
    margin-bottom: 10px;
  }
</style>
