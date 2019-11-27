import path from 'path';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import svelte from 'rollup-plugin-svelte';
import livereload from 'rollup-plugin-livereload';
import serve from 'rollup-plugin-serve';
import typescript from 'rollup-plugin-typescript2';
import replace from '@rollup/plugin-replace';
import alias from '@rollup/plugin-alias';

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
  !production && livereload('./'),
  !production && serve({
    open: true,
    contentBase: './',
    host: devServerOptions.host,
    port: devServerOptions.port,
  })
);

export default production ? [ libConfig, demoConfig ] : demoConfig;
