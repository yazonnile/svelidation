const path = require('path');
const types = {
  lib: 1,
  e2e: 2,
  unit: 3,
  demo: 4
};
const root = path.resolve(__dirname, '../');
const buildPath = p => path.resolve(root, p);
const paths = {
  root,
  dist: buildPath('dist'),
  src: buildPath('src'),
  lib: buildPath('src/lib'),
  e2e: buildPath('test/e2e'),
  e2eDist: buildPath('test/e2e/dist'),
  unit: buildPath('test/unit'),
  docs: buildPath('docs'),
  demo: buildPath('src/demo'),
};

const opts = require('./options')({ types, paths });
const plugins = require('./plugins')({ types, paths });

module.exports = {
  types, paths,
  buildConfig: (type, { production, initServe }) => {
    switch (type) {
      case types.lib:
        return {
          ...opts(type, production),
          plugins: plugins([
            'resolve',
            'alias',
            'commonjs',
            'typescript'
          ], { type, production })
        };

      case types.demo:
        return  {
          ...opts(type, production),
          plugins: plugins([
            'resolve',
            'alias',
            'commonjs',
            'typescript',
            'svelte',
            'liveReload',
            'serve',
          ], { type, production })
        };

      case types.e2e:
        return {
          ...opts(type, production),
          plugins: plugins([
            'svelte',
            'resolve',
            'alias',
            'commonjs',
            initServe && 'serve',
            initServe && 'liveReload',
          ], { type, production })
        };
    }
  }
};
