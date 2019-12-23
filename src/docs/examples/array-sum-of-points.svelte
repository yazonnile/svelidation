<script>
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import createValidation from 'lib/lib';
  import Error from 'docs/ui/error.svelte';
  import Form from 'docs/examples/components/form.svelte';
  import Code from 'docs/ui/code.svelte';

  let score = tweened(0, {
    duration: 400,
    easing: cubicOut
  });

  const { createEntry, createForm } = createValidation({ listenInputEvents: 1 });
  const [ errors, value, input ] = createEntry({
    type: 'array',
    value: [],
    required: true
  });

  $: $score = $value.reduce((a, b) => (a + b), 0);
  $: color = ($score < 0 ? 'red' : ($score < 50 ? 'inherit' : ($score < 100 ? '#768c7b' : '#32d75e')));
  $: disabled = $score === 100;

  const jsCode = `let score = tweened(0, {
  duration: 400,
  easing: cubicOut
});

const { createEntry, createForm } = createValidation({ listenInputEvents: 1 });
const [ errors, value, input ] = createEntry({
  type: 'array',
  value: [],
  required: true
});

$: $score = $value.reduce((a, b) => (a + b), 0);
$: color = ($score < 0 ? 'red' : ($score < 50 ? 'inherit' : ($score < 100 ? '#768c7b' : '#32d75e')));
$: disabled = $score === 100;`;

  const htmlCode = `<h1>Pick as much sportsman as you can</h1>
<input {disabled} use:input bind:group={$value} type="checkbox" value={9} /> Tom Brady
<input {disabled} use:input bind:group={$value} type="checkbox" value={-40} /> Isaac Newton
<input {disabled} use:input bind:group={$value} type="checkbox" value={30} /> Pete Carrol
<input {disabled} use:input bind:group={$value} type="checkbox" value={-30} /> Steve Jobs
<input {disabled} use:input bind:group={$value} type="checkbox" value={14} /> Paul Gascoigne
<input {disabled} use:input bind:group={$value} type="checkbox" value={16} /> Pele
<input {disabled} use:input bind:group={$value} type="checkbox" value={20} /> Albetro Contador
<input {disabled} use:input bind:group={$value} type="checkbox" value={-20} /> David Gilmour
<input {disabled} use:input bind:group={$value} type="checkbox" value={11} /> Georges St-Pierre
<input {disabled} use:input bind:group={$value} type="checkbox" value={-10} /> Rich Harris

{#if $errors.includes('required')}Pick something please{/if}
{#if $value.length}
  <h1 style={\`color: \${color}\`}>Your score: {$score.toFixed(0)}/100 {#if $score === 100}You won!{/if}</h1>
{/if}`
</script>

<Form {createForm} title="Pick as much sportsman as you can">
  <div class="cells">
    <label><input {disabled} use:input bind:group={$value} value={9} class="input-choice" type="checkbox" /> Tom Brady</label>
    <label><input {disabled} use:input bind:group={$value} value={-40} class="input-choice" type="checkbox" /> Isaac Newton</label>
    <label><input {disabled} use:input bind:group={$value} value={30} class="input-choice" type="checkbox" /> Pete Carrol</label>
    <label><input {disabled} use:input bind:group={$value} value={-30} class="input-choice" type="checkbox" /> Steve Jobs</label>
    <label><input {disabled} use:input bind:group={$value} value={14} class="input-choice" type="checkbox" /> Paul Gascoigne</label>
    <label><input {disabled} use:input bind:group={$value} value={16} class="input-choice" type="checkbox" /> Pele</label>
    <label><input {disabled} use:input bind:group={$value} value={20} class="input-choice" type="checkbox" /> Albetro Contador</label>
    <label><input {disabled} use:input bind:group={$value} value={-20} class="input-choice" type="checkbox" /> David Gilmour</label>
    <label><input {disabled} use:input bind:group={$value} value={11} class="input-choice" type="checkbox" /> Georges St-Pierre</label>
    <label><input {disabled} use:input bind:group={$value} value={-10} class="input-choice" type="checkbox" /> Rich Harris</label>
  </div>

  <Error {errors} errorCode="required" errorText="Pick something please" />
  {#if $value.length}
    <h1 style={`color: ${color}`} >Your score: {$score.toFixed(0)}/100 {#if $score === 100}You won!{/if}</h1>
  {/if}

  <Code code={jsCode} />
  <Code code={htmlCode} />
</Form>
