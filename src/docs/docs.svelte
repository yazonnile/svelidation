<script>
  import { fade } from 'svelte/transition';
  import Editor from './builder/builder.svelte';
  import String from './examples/string.svelte';
  import Email from './examples/email.svelte';
  import Number from './examples/number.svelte';
  import Boolean from './examples/boolean.svelte';
  import Array from './examples/array.svelte';
  import Required from './examples/required.svelte';
  import Match from './examples/match.svelte';
  import Equal from './examples/equal.svelte';
  import ArraySumOfPoints from './examples/array-sum-of-points.svelte';
  import FieldConfirm from './examples/field-confirm.svelte';

  let barId = 0;
  let pageId = barId;
  let transitionActive = false;

  const switchPages = (n) => {
    if (transitionActive) return;
    transitionActive = true;
    barId = n;
  };
</script>

<a href="//github.com/yazonnile/svelidation" class="logo">
  <img src="./logo.svg" alt="svelidation" />
  go to github
</a>

<div class="tabs">
  <button class="tabs--button" on:click={() => switchPages(0)} disabled={pageId === 0}>Examples</button>
  <button class="tabs--button" on:click={() => switchPages(1)} disabled={pageId === 1}>Builder</button>
  <i class="tabs--bar" style={`transform: translateX(${100 * barId}%)`}></i>
</div>

{#if !transitionActive}
  <div
    transition:fade={{ delay: 0, duration: 250 }}
    on:outroend={() => (pageId = barId, transitionActive = false)}
  >
    {#if pageId === 0}
      <String />
      <Email />
      <Number />
      <Boolean />
      <Array />
      <Required />
      <Match />
      <Equal />
      <ArraySumOfPoints />
      <FieldConfirm />
    {:else}
      <Editor />
    {/if}
  </div>
{/if}


<style global>
  @import url('https://fonts.googleapis.com/css?family=Open+Sans&display=swap');

  .tabs {
    border-bottom: 5px solid var(--mainColorLight);
    display: flex;
    margin-bottom: 20px;
    position: relative;
  }

  .tabs--bar {
    background: var(--mainColor);
    height: 5px;
    left: 0;
    position: absolute;
    top: 100%;
    transition: .5s transform cubic-bezier(0.86, 0, 0.07, 1);
    width: 50%;
  }

  .tabs--button {
    background: none;
    border: 0;
    cursor: pointer;
    flex: 1;
    font-size: 20px;
    line-height: 20px;
    outline: none;
    padding: 20px;
    text-transform: uppercase;
  }

  .tabs--button:hover {
    color: var(--mainColor);
  }

  .tabs--button:disabled {
    color: var(--mainColor);
  }

  .logo {
    color: inherit;
    cursor: pointer;
    display: block;
    font-size: 18px;
    line-height: 22px;
    margin: 10px auto 20px;
    max-width: 260px;
    text-decoration: none;
    text-align: center;
  }

  .logo img {
    display: block;
    max-width: 100%;
  }

  .logo:hover {
    color: var(--mainColor);
  }

  .pages {
    transition: .3s opacity ease;
  }

  .pages.transition--active {
    opacity: 0;
  }

  h1 {
    color: var(--mainColor);
    font-size: 24px;
    line-height: 28px;
    margin-bottom: .5em;
    overflow: hidden;
    text-transform: uppercase;
  }

  .input-text,
  select {
    border: 1px solid #333;
    border-radius: 3px;
    font-size: 14px;
    height: 40px;
    line-height: 18px;
    outline: 0;
    padding: 5px 10px;
    width: 100%;
  }

  select {
    height: auto;
    line-height: inherit;
    padding: 5px;
  }

  .input-text:focus,
  select:focus {
    border-color: var(--mainColor);
    box-shadow: 0 0 3px var(--mainColor);
  }

  .input-choice {
    display: inline-block;
    margin: 4px 10px 0 0;
    vertical-align: top;
  }

  .cells {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    align-items: flex-start;
    padding: 10px;
    justify-content: center;
  }

  .cells > * {
    background: #fff;
    border: 1px solid var(--grey);
    box-shadow: 0 0 5px var(--grey);
    border-radius: 3px;
    cursor: pointer;
    margin: 0 5px 10px;
    overflow: hidden;
    padding: 5px;
    text-align: center;
    width: 150px;
  }

  .cells input {
    display: block;
    margin: 0 auto 5px;
  }

  code {
    outline: 0;
  }
</style>
