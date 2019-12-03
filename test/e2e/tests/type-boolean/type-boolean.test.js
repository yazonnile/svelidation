import Page from 'helpers/page';
const page = new Page();

fixture `type boolean`
  .page `http://localhost:4411/?test=type-boolean`;

test('default', async t => {
  await t
    .click(page.slideButton.withExactText('default'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).notOk();
});

test('required', async t => {
  await t
    .click(page.slideButton.withExactText('required'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .click(page.inputs)
    .expect(page.errors.exists).notOk();
});
