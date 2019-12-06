<script>
  import { fade } from 'svelte/transition';
  import Editor from './editor/editor.svelte';
  import String from './components/types/string.svelte';
  import Email from './components/types/email.svelte';
  import Number from './components/types/number.svelte';
  import Boolean from './components/types/boolean.svelte';
  import Array from './components/types/array.svelte';
  import Required from './components/types/required.svelte';
  import Match from './components/types/match.svelte';
  import Equal from './components/types/equal.svelte';
  import ArraySumOfPoints from './components/advanced/array-sum-of-points.svelte';
  import FieldConfirm from './components/advanced/field-confirm.svelte';

  let barId = 1;
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
  <button class:tabs--active={pageId === 0} class="tabs--button" on:click={() => switchPages(0)} disabled={pageId === 0}>Examples</button>
  <button class:tabs--active={pageId === 1} class="tabs--button" on:click={() => switchPages(1)} disabled={pageId === 1}>Editor</button>
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
    transition: transform .5s cubic-bezier(0.86, 0, 0.07, 1);
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
    color: inherit;
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
    transition: opacity .3s ease;
  }

  .pages.transition--active {
    opacity: 0;
  }

  h1 {
    font-size: 24px;
    line-height: 28px;
    margin-bottom: 1em;
  }

  mark, pre {
    background: #ddd;
    border-radius: 3px;
    font-weight: normal;
    font-family: monospace;
    padding: 0 5px;
  }

  pre {
    padding: 5px 10px;
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

  .input-choice {
    display: inline-block;
    margin: 4px 10px 0 0;
    vertical-align: top;
  }
</style>
