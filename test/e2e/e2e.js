const path = require('path');
const fs = require('fs-extra');
const StaticServer = require('static-server');
const createTestCafe = require('testcafe');
const globby = require('globby');
const rollup = require('rollup');
const moduleAlias = require('module-alias');
const { production = false } = require('yargs').argv;
const { buildConfig, types, paths } = require('../../build');

const staticServerPort = 4411;

const log = (msg) => console.log(`>>> ${msg}`);
const exit = (status) => process.exit(status);

moduleAlias.addAliases({
  helpers: path.resolve(__dirname, 'helpers')
});

(async() => {
  log('remove old files');
  await fs.remove(paths.e2eDist);

  log('copy new files');
  await fs.copy(`${paths.docs}/index.html`, `${paths.e2eDist}/index.html`);

  log('build test bundles');
  const entryPoints = globby.sync([`${paths.e2e}/tests/**/*.js`]).filter(item => !item.match(/\.test\.js$/));
  for (let i = 0; i < entryPoints.length; i++) {
    const config = buildConfig(types.e2e, {
      production,
      initServe: i === entryPoints.length - 1
    });

    const input = { input: entryPoints[i], plugins: config.plugins };
    const { output } = config;
    const bundle = await rollup.rollup(input);
    await bundle.write(output);

    if (!production) {
      rollup.watch({
        ...input,
        output: [ output ],
        watch: { clearScreen: false }
      });
    }
  }

  if (!production) {
    log('tests skipped because of dev mode');
    return;
  }

  log('start static server');
  await new Promise(resolve => {
    new StaticServer({
      rootPath: paths.e2eDist,
      port: staticServerPort
    }).start(resolve);
  });

  log(`Server listening to http://localhost:${staticServerPort}`);
  log('starting E2E/UI tests...');

  const testFiles = await globby(`${paths.e2e}/tests/**/*.test.js`);

  if (!testFiles.length) {
    log('no E2E test files found. Skipping E2E tests.');
    return exit(0);
  }

  const testcafe = await createTestCafe();
  const failedCount = await testcafe
    .createRunner()
    .src(testFiles)
    .browsers(['puppeteer'])
    .reporter('spec')
    .concurrency(3)
    .run();

  testcafe.close();
  if (failedCount === 0) {
    log('>> E2E/UI tests passed!');
    exit(0);
  } else {
    exit(1);
  }
})();
