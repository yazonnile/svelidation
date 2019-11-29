const { Server, config } = require('karma');
const { production = false } = require('yargs').argv;
const { buildConfig, types, paths } = require('../../build');
const rollup = require('rollup');
const fs = require('fs-extra');

(async() => {
  console.log('remove old files');
  await fs.remove(paths.unitDist);

  console.log('build test bundles');
  const rollupConfig = buildConfig(types.unit, { production });
  const input = rollupConfig;
  const { output } = rollupConfig;
  const bundle = await rollup.rollup(input);
  await bundle.write(output);

  if (!production) {
    rollup.watch({
      ...input,
      output: [ output ],
      watch: { clearScreen: false }
    });
  }

  console.log('Start karma server');
  const server = new Server({
    frameworks: ['jasmine'],
    basePath: paths.unitDist,
    files: ['specs.js'],
    reporters: [production ? 'progress' : 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: production ? config.LOG_WARN : config.LOG_DEBUG,
    autoWatch: !production,
    browsers: [production ? 'ChromeHeadless' : 'Chrome'],
    singleRun: production,
    concurrency: Infinity,
    client: {
      clearContext: false
    }
  }, function(exitCode) {
    console.log('Karma has exited with ' + exitCode);
    process.exit(exitCode);
  });

  await server.start();
})();


