const { buildConfig, types } = require('./build');
const production = !process.env.ROLLUP_WATCH;
const libConfig = buildConfig(types.lib, { production });
const demoConfig = buildConfig(types.demo, { production });

module.exports = production ? [ libConfig, demoConfig ] : demoConfig;
