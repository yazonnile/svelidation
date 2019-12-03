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
  unitDist: buildPath('test/unit/dist'),
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
            'alias',
            'resolve',
            'commonjs',
            'typescript',
            'replace',
          ], { type, production })
        };

      case types.demo:
        return  {
          ...opts(type, production),
          plugins: plugins([
            'alias',
            'resolve',
            'commonjs',
            'typescript',
            'svelte',
            'liveReload',
            'serve',
            'replace',
          ], { type, production })
        };

      case types.e2e:
        return {
          ...opts(type, production),
          plugins: plugins([
            'alias',
            'resolve',
            'commonjs',
            'svelte',
            'replace',
            initServe && 'serve',
            initServe && 'liveReload',
          ], { type, production })
        };

      case types.unit:
        return {
          ...opts(type, production),
          plugins: plugins([
            'alias',
            'resolve',
            'commonjs',
            'typescript',
            'liveReload',
            'globFiles',
            'replace',
          ], { type, production })
        };
    }
  }
};
