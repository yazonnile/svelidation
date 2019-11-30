import Page from 'page';
const page = new Page();

fixture `api createEntry`
  .page `http://localhost:4411/?test=api-create-entry`;

test('should validate only input with use', async t => {
  await t
    .click(page.slideButton.withExactText('use'))
    .expect(page.forms.exists).ok()
    .expect(page.inputs.count).eql(3)
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.count).eql(2)
    .typeText(page.inputs.nth(2), '123456')
    .expect(page.errors.count).eql(1);
});
