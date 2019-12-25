<script>
  import { getValidation, Form, Slide, Entry } from 'helpers/helpers';

  const getConfig = (options) => {
    return { entries: [
      { type: 'string', min: 5 },
      { type: 'string', max: 5 },
      { type: 'string', min: 5, max: 10 },
      { type: 'number' }
    ], options }
  };

  const {
    entries: [default0Entry, default1Entry, default2Entry, default3Entry],
    createForm: defaultCreateForm
  } = getValidation(getConfig());

  const {
    entries: [
      [custom0Errors, custom0Value, custom0Input],
      [custom1Errors, custom1Value, custom1Input],
      [custom2Errors, custom2Value, custom2Input],
      [custom3Errors, custom3Value, custom3Input],
    ],
    createForm: customCreateForm
  } = getValidation(getConfig({
    useCustomErrorsStore: (errors, params) => {
      return errors.reduce((result, ruleName) => {
        result[ruleName] = {
          value: params[ruleName]
        };
        return result;
      }, {});
    }
  }));

  let activeId = 'custom';
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <Entry entry={default0Entry} />
    <Entry entry={default1Entry} />
    <Entry entry={default2Entry} />
    <Entry entry={default3Entry} />
  </Form>
</Slide>

<Slide id="custom" bind:activeId>
  <Form createForm={customCreateForm}>
    <input type="text" use:custom0Input bind:value={$custom0Value} />
    {#each Object.keys($custom0Errors) as ruleName}<p class="error">{ruleName} <span class="error-value">{$custom0Errors[ruleName].value}</span></p>{/each}
    <input type="text" use:custom1Input bind:value={$custom1Value} />
    {#each Object.keys($custom1Errors) as ruleName}<p class="error">{ruleName} <span class="error-value">{$custom1Errors[ruleName].value}</span></p>{/each}
    <input type="text" use:custom2Input bind:value={$custom2Value} />
    {#each Object.keys($custom2Errors) as ruleName}<p class="error">{ruleName} <span class="error-value">{$custom2Errors[ruleName].value}</span></p>{/each}
    <input type="text" use:custom3Input bind:value={$custom3Value} />
    {#each Object.keys($custom3Errors) as ruleName}<p class="error">{ruleName} <span class="error-value">{$custom3Errors[ruleName].value}</span></p>{/each}
  </Form>
</Slide>
