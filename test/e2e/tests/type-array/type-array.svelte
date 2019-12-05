<script>
  import { getValidation, Form, Slide } from 'helpers/helpers';

  const getConfig = (params = {}) => {
    return { entries: [{ type: 'array', ...params, value: [] }] }
  };

  const {
    entries: [[ defaultErrors, defaultValue, defaultInput ]],
    createForm: defaultCreateForm
  } = getValidation(getConfig());

  const {
    entries: [[ requiredErrors, requiredValue, requiredInput ]],
    createForm: requiredCreateForm
  } = getValidation(getConfig({ required: true }));

  const {
    entries: [[ minErrors, minValue, minInput ]],
    createForm: minCreateForm
  } = getValidation(getConfig({ min: 2 }));

  const {
    entries: [[ maxErrors, maxValue, maxInput ]],
    createForm: maxCreateForm
  } = getValidation(getConfig({ max: 1, required: true }));

  const {
    entries: [[ equalErrors, equalValue, equalInput ]],
    createForm: equalCreateForm
  } = getValidation(getConfig({ equal: [0,2] }));

  const {
    entries: [[ includesErrors, includesValue, includesInput ]],
    createForm: includesCreateForm
  } = getValidation(getConfig({ includes: 1 }));

  let activeId = 'default';
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <label><input type="checkbox" use:defaultInput bind:group={$defaultValue} value={0} /></label>
    <label><input type="checkbox" use:defaultInput bind:group={$defaultValue} value={1} /></label>
    <label><input type="checkbox" use:defaultInput bind:group={$defaultValue} value={2} /></label>
    {#if $defaultErrors.length}
      <p class="error">error</p>
    {/if}
  </Form>
</Slide>

<Slide id="required" bind:activeId>
  <Form createForm={requiredCreateForm}>
    <label><input type="checkbox" use:requiredInput bind:group={$requiredValue} value={0} /></label>
    <label><input type="checkbox" use:requiredInput bind:group={$requiredValue} value={1} /></label>
    <label><input type="checkbox" use:requiredInput bind:group={$requiredValue} value={2} /></label>
    {#if $requiredErrors.length}
      <p class="error">error</p>
    {/if}
  </Form>
</Slide>

<Slide id="min" bind:activeId>
  <Form createForm={minCreateForm}>
    <label><input type="checkbox" use:minInput bind:group={$minValue} value={0} /></label>
    <label><input type="checkbox" use:minInput bind:group={$minValue} value={1} /></label>
    <label><input type="checkbox" use:minInput bind:group={$minValue} value={2} /></label>
    {#if $minErrors.length}
      <p class="error">error</p>
    {/if}
  </Form>
</Slide>

<Slide id="max" bind:activeId>
  <Form createForm={maxCreateForm}>
    <label><input type="checkbox" use:maxInput bind:group={$maxValue} value={0} /></label>
    <label><input type="checkbox" use:maxInput bind:group={$maxValue} value={1} /></label>
    <label><input type="checkbox" use:maxInput bind:group={$maxValue} value={2} /></label>
    {#if $maxErrors.length}
      <p class="error">error</p>
    {/if}
  </Form>
</Slide>

<Slide id="equal" bind:activeId>
  <Form createForm={equalCreateForm}>
    <label><input type="checkbox" use:equalInput bind:group={$equalValue} value={0} /></label>
    <label><input type="checkbox" use:equalInput bind:group={$equalValue} value={1} /></label>
    <label><input type="checkbox" use:equalInput bind:group={$equalValue} value={2} /></label>
    {#if $equalErrors.length}
      <p class="error">error</p>
    {/if}
  </Form>
</Slide>

<Slide id="includes" bind:activeId>
  <Form createForm={includesCreateForm}>
    <label><input type="checkbox" use:includesInput bind:group={$includesValue} value={0} /></label>
    <label><input type="checkbox" use:includesInput bind:group={$includesValue} value={1} /></label>
    <label><input type="checkbox" use:includesInput bind:group={$includesValue} value={2} /></label>
    {#if $includesErrors.length}
      <p class="error">error</p>
    {/if}
  </Form>
</Slide>
