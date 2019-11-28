import Page from 'page';
const page = new Page();

fixture `api validateAll`
  .page `http://localhost:4411/?test=api-validate-all`;

test('should validate only stores witch is in use', async t => {
  await t
    .expect(page.inputs.count).eql(4)
    .expect(page.errors.exists).notOk()
    .click(page.mainActionButton)
    .expect(page.errors.count).eql(2);
});
