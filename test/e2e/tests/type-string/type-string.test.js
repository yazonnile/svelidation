import Page, { blur } from 'helpers/page';
const page = new Page();

fixture `type string`
  .page `http://localhost:4411/?test=type-string`;

test('minLength rule', async t => {
  await t
    .click(page.slideButton.withExactText('minLength'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '122');
  await blur();
  await t
    .expect(page.errors.exists).notOk();
});

test('maxLength rule', async t => {
  await t
    .click(page.slideButton.withExactText('maxLength'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).notOk()
    .typeText(page.inputs, '1234567');
  await blur();
  await t
    .expect(page.errors.exists).ok();
});
