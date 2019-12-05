import Page, { blur } from 'helpers/page';
const page = new Page();

fixture `option validateOnEvents`
  .page `http://localhost:4411/?test=option-validate-on-events`;

test('should work on input by default', async t => {
  await t
    .click(page.slideButton.withExactText('default'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '12345');
  await blur();
  await t
    .expect(page.errors.exists).notOk();
});

test('shouldn\'t work with empty array', async t => {
  await t
    .click(page.slideButton.withExactText('empty'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '12345')
    .expect(page.errors.exists).ok();
});

test('should work with blur', async t => {
  await t
    .click(page.slideButton.withExactText('blur'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '12345');
  await blur();
  await t
    .expect(page.errors.exists).notOk();
});
