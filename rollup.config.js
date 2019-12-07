const { buildConfig, types } = require('./build');
const production = !process.env.ROLLUP_WATCH;
const libConfig = buildConfig(types.lib, { production });
const docsConfig = buildConfig(types.docs, { production });

module.exports = production ? [ libConfig, docsConfig ] : docsConfig;
