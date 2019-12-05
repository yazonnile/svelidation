<script>
  import { slide } from 'svelte/transition';

  export let errors;
  export let errorCode;
  export let errorText = '';
</script>

{#if $errors.includes(errorCode)}
  <div class="error" transition:slide|local={{ delay: 0, duration: 400 }}>
    {#if errorCode === 'required' && !errorText}
      This field is required
    {:else}
      {errorText}
    {/if}
  </div>
{/if}

<style>
  :global(input[type="checkbox"]) ~ .error {
    margin-top: 0;
  }

  .error {
    background: var(--mainColorLight);
    border: 1px solid var(--greyLight);
    border-radius: 3px;
    margin-top: 10px;
    margin-bottom: 10px;
    padding: 5px;
    position: relative;
  }
</style>
