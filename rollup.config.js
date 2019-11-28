const path = require('path');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const svelte = require('rollup-plugin-svelte');
const livereload = require('rollup-plugin-livereload');
const serve = require('rollup-plugin-serve');
const typescript = require('rollup-plugin-typescript2');
const replace = require('@rollup/plugin-replace');
const alias = require('@rollup/plugin-alias');

const production = !process.env.ROLLUP_WATCH;
const devServerOptions = {
  protocol: 'http',
  host: 'localhost',
  port: '8040'
};

const config = {
  plugins: [
    resolve({
      browser: true,
      mainFields: ['svelte', 'browser', 'module', 'main'],
      extensions: ['.mjs', '.ts', '.js', '.svelte', '.css'],
      dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/')
    }),

    alias({
      resolve: ['.ts', '.js', '.svelte'],
      entries: {
        lib: path.resolve(__dirname, 'src/lib'),
        demo: path.resolve(__dirname, 'src/demo'),
        src: path.resolve(__dirname, 'src')
      }
    }),

    commonjs(),

    typescript({
      typescript: require('typescript'),
      objectHashIgnoreUnknownHack: true,
    }),

    replace({
      'process.env.NODE_ENV': JSON.stringify(production)
    })
  ]
};

const libConfig = Object.assign({ ...config }, {
  input: 'src/index.ts',
  output: {
    sourcemap: !production,
    format: 'es',
    dir: 'dist'
  },
  external: [ 'svelte/store' ]
});

const demoConfig = Object.assign({ ...config }, {
  input: 'src/demo.ts',
  output: {
    sourcemap: !production,
    format: 'es',
    dir: 'dist'
  },
  watch: {
    clearScreen: false
  }
});

demoConfig.plugins.push(
  svelte({
    dev: !production
  }),
  !production && livereload('./dist'),
  !production && serve({
    open: true,
    contentBase: './dist',
    host: devServerOptions.host,
    port: devServerOptions.port,
  })
);

module.exports = production ? [ libConfig, demoConfig ] : demoConfig;
