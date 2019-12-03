<script>
  import { getValidation, Form, Slide } from 'helpers/helpers';

  const getConfig = (params = {}) => {
    return { entries: [{ type: 'array', ...params, value: [] }] }
  };

  const {
    entries: [[ defaultStore, defaultInput ]],
    createForm: defaultCreateForm
  } = getValidation(getConfig());

  const {
    entries: [[ requiredStore, requiredInput ]],
    createForm: requiredCreateForm
  } = getValidation(getConfig({ required: true }));

  const {
    entries: [[ minStore, minInput ]],
    createForm: minCreateForm
  } = getValidation(getConfig({ min: 2 }));

  const {
    entries: [[ maxStore, maxInput ]],
    createForm: maxCreateForm
  } = getValidation(getConfig({ max: 1, required: true }));

  const {
    entries: [[ equalStore, equalInput ]],
    createForm: equalCreateForm
  } = getValidation(getConfig({ equal: [0,2] }));

  const {
    entries: [[ includesStore, includesInput ]],
    createForm: includesCreateForm
  } = getValidation(getConfig({ includes: 1 }));

  let activeId = 'default';
</script>

<Slide id="default" bind:activeId>
  <Form createForm={defaultCreateForm}>
    <label><input type="checkbox" use:defaultInput bind:group={$defaultStore.value} value={0} /></label>
    <label><input type="checkbox" use:defaultInput bind:group={$defaultStore.value} value={1} /></label>
    <label><input type="checkbox" use:defaultInput bind:group={$defaultStore.value} value={2} /></label>
    {#if $defaultStore.errors.length}
      <p class="error">error</p>
    {/if}
  </Form>
</Slide>

<Slide id="required" bind:activeId>
  <Form createForm={requiredCreateForm}>
    <label><input type="checkbox" use:requiredInput bind:group={$requiredStore.value} value={0} /></label>
    <label><input type="checkbox" use:requiredInput bind:group={$requiredStore.value} value={1} /></label>
    <label><input type="checkbox" use:requiredInput bind:group={$requiredStore.value} value={2} /></label>
    {#if $requiredStore.errors.length}
      <p class="error">error</p>
    {/if}
  </Form>
</Slide>

<Slide id="min" bind:activeId>
  <Form createForm={minCreateForm}>
    <label><input type="checkbox" use:minInput bind:group={$minStore.value} value={0} /></label>
    <label><input type="checkbox" use:minInput bind:group={$minStore.value} value={1} /></label>
    <label><input type="checkbox" use:minInput bind:group={$minStore.value} value={2} /></label>
    {#if $minStore.errors.length}
      <p class="error">error</p>
    {/if}
  </Form>
</Slide>

<Slide id="max" bind:activeId>
  <Form createForm={maxCreateForm}>
    <label><input type="checkbox" use:maxInput bind:group={$maxStore.value} value={0} /></label>
    <label><input type="checkbox" use:maxInput bind:group={$maxStore.value} value={1} /></label>
    <label><input type="checkbox" use:maxInput bind:group={$maxStore.value} value={2} /></label>
    {#if $maxStore.errors.length}
      <p class="error">error</p>
    {/if}
  </Form>
</Slide>

<Slide id="equal" bind:activeId>
  <Form createForm={equalCreateForm}>
    <label><input type="checkbox" use:equalInput bind:group={$equalStore.value} value={0} /></label>
    <label><input type="checkbox" use:equalInput bind:group={$equalStore.value} value={1} /></label>
    <label><input type="checkbox" use:equalInput bind:group={$equalStore.value} value={2} /></label>
    {#if $equalStore.errors.length}
      <p class="error">error</p>
    {/if}
  </Form>
</Slide>

<Slide id="includes" bind:activeId>
  <Form createForm={includesCreateForm}>
    <label><input type="checkbox" use:includesInput bind:group={$includesStore.value} value={0} /></label>
    <label><input type="checkbox" use:includesInput bind:group={$includesStore.value} value={1} /></label>
    <label><input type="checkbox" use:includesInput bind:group={$includesStore.value} value={2} /></label>
    {#if $includesStore.errors.length}
      <p class="error">error</p>
    {/if}
  </Form>
</Slide>
