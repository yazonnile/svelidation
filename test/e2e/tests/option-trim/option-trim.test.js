import Page, { blur } from 'helpers/page';
const page = new Page();

fixture `option trim`
  .page `http://localhost:4411/?test=option-trim`;

const runTest = (btnName, lastCheck) => {
  test(btnName, async t => {
    await t
      .click(page.slideButton.withExactText(btnName))
      .expect(page.forms.exists).ok()
      .expect(page.errors.exists).notOk()
      .click(page.submitButton)
      .expect(page.errors.exists).ok()
      .typeText(page.inputs, '  345');
    await blur();
    await t
      .expect(page.errors.exists)[lastCheck]();
  });
};

runTest('default', 'notOk');
runTest('true', 'ok');
runTest('false', 'notOk');

test('mix', async t => {
  await t
    .click(page.slideButton.withExactText('mix'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.count).eql(4)
    .typeText(page.inputs.nth(0), '  345')
    .typeText(page.inputs.nth(1), '  345');
  await blur();
  await t
    .expect(page.errors.count).eql(1);
});
