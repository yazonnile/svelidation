const path = require('path');

const devServerOptions = {
  protocol: 'http',
  host: 'localhost',
  port: '8040'
};

module.exports = ({ types, paths }) => (pluginsNames, { type, production }) => {
  const plugins = {
    alias: (type) => {
      let opts = {resolve: ['.ts', '.js', '.svelte']};

      switch (type) {
        case types.lib:
        case types.demo:
        case types.unit:
          opts.entries = {
            lib: paths.lib,
            demo: paths.demo,
            src: paths.src
          };
          break;

        case types.e2e:
          opts.entries = {
            svelidation: paths.dist,
            helpers: path.join(paths.e2e, 'helpers')
          };
          break;
      }

      return require('@rollup/plugin-alias')(opts);
    },
    resolve: () => {
      return require('rollup-plugin-node-resolve')({
        browser: true,
        mainFields: ['svelte', 'browser', 'module', 'main'],
        extensions: ['.mjs', '.ts', '.js', '.svelte', '.css'],
        dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/')
      });
    },
    commonjs: () => require('rollup-plugin-commonjs')(),
    typescript: () => {
      return require('rollup-plugin-typescript2')({
        typescript: require('typescript'),
        objectHashIgnoreUnknownHack: true,
      })
    },
    svelte: (type, production) => {
      return require('rollup-plugin-svelte')({
        dev: !production
      });
    },
    liveReload: (type, production) => {
      let src;
      switch (type) {
        case types.demo:
          src = paths.docs;
          break;

        case types.e2e:
          src = paths.e2eDist;
          break;

        case types.unit:
          src = paths.unitDist;
          break;
      }

      return !production && require('rollup-plugin-livereload')(src);
    },
    serve: (type, production) => {
      let opts;
      switch (type) {
        case types.demo:
          opts = {
            open: true,
            contentBase: paths.docs,
            host: devServerOptions.host,
            port: devServerOptions.port,
          };
          break;

        case types.e2e:
          opts = {
            open: true,
            contentBase: paths.e2eDist,
            host: devServerOptions.host,
            port: devServerOptions.port,
            openPage: '?test=default',
          };
          break;
      }

      return !production && require('rollup-plugin-serve')(opts);
    },
    globFiles: () => {
      return require('rollup-plugin-glob-files').default([{
        file: 'src/unit.ts',
        include: [`**/*.spec.js`],
        justImport: true
      }]);
    }
  };

  return pluginsNames.reduce((list, name) => {
    if (typeof plugins[name] === 'function') {
      list.push(plugins[name](type, production));
    } else if (typeof name === 'string') {
      console.log(`plugin ${name} is absent`);
    }
    return list;
  }, []);
};
