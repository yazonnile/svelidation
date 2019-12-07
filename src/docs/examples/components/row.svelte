<script>
  export let labelText = '';
</script>

<div class="row">
  <label>
    <span class="label">{labelText}</span>
    <slot />
  </label>
</div>

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
</style>
