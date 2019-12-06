<script>

  let num = 0;
  const useFunction = () => {
    console.log('INIT');
  };

  const reset = () => {
    num++;
  };
</script>

{#if num%2}
  <div use:useFunction>DIV</div>
{:else}
  <div use:useFunction>DIV</div>
{/if}
<button on:click={reset}>RESET</button>

<style>

</style>
