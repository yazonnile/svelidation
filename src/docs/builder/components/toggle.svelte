<script>
  export let checked = false;
  export let id = false;
</script>

<label class="toggle" class:checked>
  <input type="checkbox" bind:checked on:change {id} />
</label>

<style>
  .toggle {
    background: #fff;
    box-shadow: 0 0 5px var(--grey);
    border-radius: 15px;
    cursor: pointer;
    display: inline-block;
    height: 20px;
    overflow: hidden;
    position: relative;
    transition: .3s background-color ease-in-out;
    vertical-align: top;
    width: 40px;
  }

  .toggle.checked {
    background: var(--mainColor);
  }

  .toggle::after {
    background: var(--grey);
    border-radius: 7px;
    content: '';
    height: 14px;
    left: 3px;
    position: absolute;
    top: 3px;
    transition-property: transform, background-color;
    transition-duration: .3s;
    transition-timing-function: ease-in-out;
    width: 14px;
  }

  .toggle.checked::after {
    background: #fff;
    transform: translateX(calc(100% + 6px));
  }

  input {
    left: -9999px;
    position: absolute;
    top: -9999px;
  }
</style>
