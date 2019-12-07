<script>
  export let code = '';

  const addCode = (node) => {
    node.textContent = code;
  };
</script>

<pre><code use:addCode></code></pre>

<style>
  pre {
    background: var(--mainColorLight);
    border: 1px solid var(--grey);
    border-radius: 3px;
    box-shadow: 0 0 5px var(--grey);
    cursor: text;
    font-weight: normal;
    font-family: monospace;
    margin-bottom: 10px;
    overflow-x: auto;
    padding: 5px 10px;
  }
</style>
