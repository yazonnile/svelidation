import Page, { blur } from 'page';
const page = new Page();

fixture `validateOn`
  .page `http://localhost:4411/?test=validate-on`;

test('should work on input by default', async t => {
  await t
    .click(page.slideButton.withExactText('default'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '12345')
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
