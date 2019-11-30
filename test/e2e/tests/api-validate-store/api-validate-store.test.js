import Page from 'helpers/page';
const page = new Page();

fixture `api validateStore`
  .page `http://localhost:4411/?test=api-validate-store`;

test('should validate store without submit', async t => {
  await t
    .expect(page.errors.exists).notOk()
    .click(page.primaryButton)
    .expect(page.errors.count).eql(1);
});
