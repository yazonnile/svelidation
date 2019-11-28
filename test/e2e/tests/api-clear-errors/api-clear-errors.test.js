import Page from 'page';
const page = new Page();

fixture `api clearErrors`
  .page `http://localhost:4411/?test=api-clear-errors`;

test('should validate only stores witch is in use', async t => {
  await t
    .expect(page.forms.exists).ok()
    .expect(page.inputs.count).eql(3)
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.count).eql(2)
    .click(page.mainActionButton)
    .expect(page.errors.count).eql(0);
});
