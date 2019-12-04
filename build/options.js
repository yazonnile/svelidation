module.exports = ({ paths, types }) => (type, production) => {
  switch (type) {
    case types.lib:
    return {
      input: 'src/lib/lib.ts',
      output: {
        file: `${paths.dist}/index.js`,
        sourcemap: !production,
        format: 'es',
      },
      external: [ 'svelte/store' ]
    };

    case types.docs:
    return {
      input: 'src/docs/docs.ts',
      output: {
        dir: paths.docsDist,
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
      input: 'test/unit/unit.ts',
      output: {
        file: `${paths.unitDist}/specs.js`,
        sourcemap: !production,
        format: 'iife',
      },
      watch: { clearScreen: false }
    };
  }
};
