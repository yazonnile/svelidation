<script>
  export let createForm;
  export let createFormParams = {};
</script>

<form on:submit|preventDefault use:createForm={createFormParams}>
  <slot></slot>
  <button type="submit">Submit</button>
</form>
