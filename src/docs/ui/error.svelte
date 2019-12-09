<script>
  export let errors;
  export let errorCode;
  export let errorText = '';
  export let fromLoop = false;

  import { slide } from 'svelte/transition';

  const removeError = () => {
    errors.update(v => {
      return v.filter(e => (e !== errorCode));
    });
  }
</script>

{#if $errors.includes(errorCode)}
  <div class="error" transition:slide|local={{ delay: 0, duration: 400 }} on:click={removeError}>
    <span>
      {#if errorCode === 'required' && !errorText && !fromLoop}
        This field is required
      {:else if errorText}
        {errorText}
      {:else}
        {errorCode} rule validation error
      {/if}
    </span>
  </div>
{/if}

<style>
  :global(input[type="checkbox"]) ~ .error {
    margin-top: 0;
  }

  .error {
    background: var(--redColor);
    border-radius: 3px;
    color: #fff;
    cursor: pointer;
    margin-top: 10px;
    margin-bottom: 10px;
    overflow: hidden;
    padding: 5px 50px 5px 5px;
    position: relative;
    transition: .5s color .3s ease-in-out;
  }

  .error:hover {
    color: #f37f64;
  }

  span {
    display: inline-block;
    position: relative;
    vertical-align: top;
  }

  span::after {
    box-sizing: border-box;
    color: #fff;
    content: 'remove';
    font-weight: bold;
    height: 100%;
    font-size: 1em;
    left: 100%;
    opacity: 0;
    padding: 0 10px;
    position: absolute;
    text-align: center;
    transform: translateX(200%);
    transition-delay: .3s;
    transition-duration: .3s;
    transition-timing-function: ease-in-out;
    transition-property: opacity, transform;
    text-transform: uppercase;
    top: 0;
  }

  .error:hover span::after {
    opacity: 1;
    transform: translateX(0);
  }

  .error:hover,
  .error:hover span::after{
    transition-delay: .3s;
  }
</style>
