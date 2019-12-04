import Page, { blur } from 'helpers/page';
const page = new Page();

fixture `type string`
  .page `http://localhost:4411/?test=type-string`;

test('min rule', async t => {
  await t
    .click(page.slideButton.withExactText('min'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '122');
  await blur();
  await t
    .expect(page.errors.exists).notOk();
});

test('max rule', async t => {
  await t
    .click(page.slideButton.withExactText('max'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).notOk()
    .typeText(page.inputs, '1234567');
  await blur();
  await t
    .expect(page.errors.exists).ok();
});
