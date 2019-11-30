import Page from 'helpers/page';
const page = new Page();

fixture `api validate`
  .page `http://localhost:4411/?test=api-validate`;

test('should validate only stores witch is in use', async t => {
  await t
    .expect(page.inputs.count).eql(4)
    .expect(page.errors.exists).notOk()
    .click(page.primaryButton)
    .expect(page.errors.count).eql(2)
    .click(page.secondaryButton)
    .expect(page.errors.count).eql(4);
});
