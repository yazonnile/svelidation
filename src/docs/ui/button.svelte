<script>
  export let type = 'button';
</script>

<button {type} on:click>
  <slot>validate</slot>
</button>

<style>
  .row {
    margin-bottom: 10px;
  }

  .row:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
  }

  button {
    background: var(--mainColorLight);
    border-radius: 3px;
    border: 1px solid var(--grey);
    box-shadow: 0 0 5px var(--grey);
    color: inherit;
    cursor: pointer;
    height: 40px;
    font-size: inherit;
    font-weight: bold;
    margin-right: 5px;
    line-height: 28px;
    outline: 0;
    padding: 5px 10px;
    text-transform: uppercase;
  }

  button:hover {
    background-color: #fff;
  }
</style>
