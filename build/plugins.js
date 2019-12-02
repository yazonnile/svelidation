const devServerOptions = {
  protocol: 'http',
  host: 'localhost',
  port: '8040'
};

module.exports = ({ types, paths }) => (pluginsNames, { type, production }) => {
  const plugins = {
    alias: () => {
      return require('@rollup/plugin-alias')({
        entries: {
          lib: paths.lib,
          demo: paths.demo,
          dist: paths.dist,
          helpers: `${paths.e2e}/helpers`
        },
        resolve: ['.ts', '.js', '.svelte']
      });
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
      let liveReloadFolder;
      switch (type) {
        case types.demo:
          liveReloadFolder = paths.docs;
          break;

        case types.e2e:
          liveReloadFolder = paths.e2eDist;
          break;

        case types.unit:
          liveReloadFolder = paths.unitDist;
          break;
      }

      return !production && require('rollup-plugin-livereload')(liveReloadFolder);
    },
    serve: (type, production) => {
      let opts;
      switch (type) {
        case types.demo:
          opts = {
            contentBase: paths.docs,
          };
          break;

        case types.e2e:
          opts = {
            contentBase: paths.e2eDist,
            openPage: '?test=default',
          };
          break;
      }

      return !production && require('rollup-plugin-serve')({
        ...opts,
        open: true,
        host: devServerOptions.host,
        port: devServerOptions.port,
      });
    },
    globFiles: () => {
      return require('rollup-plugin-glob-files').default([{
        file: 'test/unit/unit.ts',
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
