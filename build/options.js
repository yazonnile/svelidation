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

    case types.unit:
    return {
      input: 'src/unit.ts',
      output: {
        file: `${paths.unitDist}/specs.js`,
        sourcemap: !production,
        format: 'iife',
      },
      watch: { clearScreen: false }
    };
  }
};
