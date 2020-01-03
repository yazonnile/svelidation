<script>
  export let formOptions;

  import Option from './form-options-row.svelte';
  import Button from 'docs/ui/button.svelte';
  import { createEventDispatcher } from 'svelte';

  const presence = {
    optional: formOptions.presence === 'optional',
    required: formOptions.presence === 'required'
  };
  const dispatch = createEventDispatcher();
  const onSave = () => {
    const listenInputEvents = parseFloat(formOptions.listenInputEvents);
    dispatch('save', Object.assign(formOptions, {
      listenInputEvents: isNaN(listenInputEvents) ? 0 : Math.min(2, Math.max(0, listenInputEvents)),
      presence: presence.optional ? 'optional' : (presence.required ? 'required' : null)
    }));
  };

  const onCancel = () => {
    dispatch('cancel');
  };
</script>

<Option
  id="validateOnChange"
  bind:model={formOptions.validateOnEvents.change}
  disabled={formOptions.listenInputEvents === 0}
  text="Validate on input value change"
/>
<Option
  id="validateOnInput"
  bind:model={formOptions.validateOnEvents.input}
  disabled={formOptions.listenInputEvents === 0}
  text="Validate on input event"
/>
<Option
  id="validateOnBlur"
  bind:model={formOptions.validateOnEvents.blur}
  disabled={formOptions.listenInputEvents === 0}
  text="Validate on blur event"
/>
<Option
  id="clearErrorsOnReset"
  bind:model={formOptions.clearErrorsOnEvents.reset}
  text="Empty errors on reset form event"
/>
<Option
  id="clearErrorsOnFocus"
  bind:model={formOptions.clearErrorsOnEvents.focus}
  disabled={formOptions.listenInputEvents === 0}
  text="Empty entry errors on focus input event"
/>
<Option
  id="listenInputEvents"
  bind:model={formOptions.listenInputEvents}
  text="Listen input events (0: never, 1: always: 2: after validation)"
/>
<Option
  id="presenceRequired"
  bind:model={presence.required}
  disabled={presence.optional}
  text="All fields are required by default"
/>
<Option
  id="presenceOptional"
  bind:model={presence.optional}
  disabled={presence.required}
  text="All fields are optional by default"
/>
<Option
  id="trim"
  bind:model={formOptions.trim}
  text="Trim input value for validation purpose"
/>
<Option
  id="includeAllEntries"
  bind:model={formOptions.includeAllEntries}
  text="Validate and reset all entries"
/>
<Button on:click={onSave}>Save</Button>
<Button on:click={onCancel}>Cancel</Button>
