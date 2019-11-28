const path = require('path');
const fs = require('fs-extra');
const StaticServer = require('static-server');
const createTestCafe = require('testcafe');
const globby = require('globby');
const rollup = require('rollup');
const moduleAlias = require('module-alias');

const getRollupConfig = require('./rollup');
const { production = false } = require('yargs').argv;

const root = path.resolve(__dirname, '../../');
const rootDist = path.resolve(root, 'dist');
const rootDocs = path.resolve(root, 'docs');
const e2eFolder = path.resolve(root, 'test/e2e');
const e2eDist = path.resolve(e2eFolder, 'dist');
const staticServerPort = 4411;

const log = (msg) => console.log(`>>> ${msg}`);
const exit = (status) => process.exit(status);

moduleAlias.addAliases({
  page: path.resolve(__dirname, 'helpers/page')
});

(async() => {
  log('remove old files');
  await fs.remove(e2eDist);

  log('copy new files');
  await fs.copy(`${rootDocs}/index.html`, `${e2eDist}/index.html`);

  log('build test bundles');
  const entryPoints = globby.sync([`${e2eFolder}/tests/**/*.js`]).filter(item => !item.match(/\.test\.js$/));
  for (let i = 0; i < entryPoints.length; i++) {
    const [ input, output ] = getRollupConfig({
      rootDist, e2eDist, production,
      input: entryPoints[i],
      initServe: i === entryPoints.length - 1
    });

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
      rootPath: e2eDist,
      port: staticServerPort
    }).start(resolve);
  });

  log(`Server listening to http://localhost:${staticServerPort}`);
  log('starting E2E/UI tests...');

  const testFiles = await globby(`${e2eFolder}/tests/**/*.test.js`);

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
