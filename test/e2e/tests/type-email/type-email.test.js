import Page, { blur } from 'helpers/page';
const page = new Page();

fixture `type email`
  .page `http://localhost:4411/?test=type-email`;

test('type rule', async t => {
  await t
    .click(page.slideButton.withExactText('type'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, 'aaaa');
  await blur();
  await t
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '@ascc.com');
  await blur();
  await t
    .expect(page.errors.exists).notOk();
});
