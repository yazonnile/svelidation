module.exports = ({ paths, types }) => (type, production) => {
  switch (type) {
    case types.lib:
    return {
      input: 'src/index.ts',
      output: {
        dir: paths.dist,
        sourcemap: !production,
        format: 'es',
      },
      external: [ 'svelte/store' ]
    };

    case types.demo:
    return {
      input: 'src/demo.ts',
      output: {
        dir: paths.docs,
        sourcemap: !production,
        format: 'es',
      },
      watch: { clearScreen: false }
    };

    case types.e2e:
    return {
      output: {
        dir: paths.e2eDist,
        sourcemap: !production,
        format: 'es'
      }
    };
  }
};
