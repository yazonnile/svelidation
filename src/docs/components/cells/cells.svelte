<div class="holder">
  <slot />
</div>

<style>
  .holder {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    align-items: flex-start;
    padding: 10px;
    justify-content: center;
  }

  .holder > :global(*) {
    background: var(--bgLight);
    border-radius: 3px;
    cursor: pointer;
    margin: 0 5px 10px;
    overflow: hidden;
    padding: 5px;
    text-align: center;
    width: 150px;
  }

  .holder :global(input) {
    display: block;
    margin: 0 auto 5px;
  }
</style>
