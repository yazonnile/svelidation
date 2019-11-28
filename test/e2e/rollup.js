const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const svelte = require('rollup-plugin-svelte');
const alias = require('@rollup/plugin-alias');
const livereload = require('rollup-plugin-livereload');
const serve = require('rollup-plugin-serve');
const path = require('path');

const devServerOptions = {
  protocol: 'http',
  host: 'localhost',
  port: '8040'
};

let rollupServe = [];
module.exports = ({ rootDist, e2eDist, input, production }) => {
  if (!production && !rollupServe.length) {
    rollupServe = [
      serve({
        contentBase: e2eDist,
        host: devServerOptions.host,
        port: devServerOptions.port,
        open: true
      }),
      livereload(e2eDist)
    ];
  }

  return [{
    input,
    plugins: [
      svelte({ dev: !production }),

      resolve({
        browser: true,
        mainFields: ['svelte', 'browser', 'module', 'main'],
        extensions: ['.mjs', '.js', '.svelte', '.css'],
        dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/')
      }),

      alias({
        resolve: ['.js', '.svelte'],
        entries: {
          svelidation: rootDist,
          helpers: path.join(__dirname, 'helpers')
        },
      }),

      commonjs(),

      ...rollupServe
    ]
  }, {
    format: 'es',
    dir: e2eDist,
    sourcemap: !production
  }];
};
