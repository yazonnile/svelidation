import Page, { blur } from 'helpers/page';
const page = new Page();

fixture `option presence`
  .page `http://localhost:4411/?test=option-presence`;

const runTest = (btnName) => {
  test(btnName, async t => {
    await t
      .click(page.slideButton.withExactText(btnName))
      .expect(page.forms.exists).ok()
      .expect(page.errors.exists).notOk()
      .click(page.submitButton)
      .expect(page.errors.exists).notOk()
      .typeText(page.inputs, '12345');
    await blur();
    await t
      .expect(page.errors.exists).ok();
  });
};

runTest('default');

test('required', async t => {
  await t
    .click(page.slideButton.withExactText('required'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, 'aaa@asc.asc');
  await blur();
  await t
    .expect(page.errors.exists).notOk();
});

runTest('optional');

test('mix', async t => {
  await t
    .click(page.slideButton.withExactText('mix'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.count).eql(1);
});
