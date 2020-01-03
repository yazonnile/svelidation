<script>
  export let createForm;
  export let createFormOpts = {};
  export let title;
  export let subtitle = '';
  export let type = false;
  export let rule = false;

  import Widget from 'docs/ui/widget.svelte';
</script>

<Widget>
  <form novalidate use:createForm={createFormOpts} on:submit|preventDefault>
    <h1>
    <span>
      {title}
      {#if subtitle}
        <i class="subtitle">{subtitle}</i>
      {/if}
    </span>

      {#if type}<i class="barge">type</i>{/if}
      {#if rule}<i class="barge">rule</i>{/if}
    </h1>
    <slot />
  </form>
</Widget>

<style>
  h1 {
    border-bottom: 1px solid var(--mainColor);
    color: #fff;
    overflow: hidden;
    position: relative;
  }

  h1 span {
    background: var(--mainColor);
    color: #fff;
    display: inline-block;
    padding: 0 5px;
    position: relative;
    vertical-align: top;
  }

  .subtitle {
    background: var(--mainColor);
    bottom: 0;
    font-size: 12px;
    font-style: normal;
    line-height: 16px;
    left: 100%;
    padding: 1px 5px 0;
    position: absolute;
    white-space: nowrap;
  }

  .barge {
    background: var(--mainColor);
    font-style: normal;
    padding: 0 5px;
    position: absolute;
    right: 0;
    top: 0;
  }
</style>
