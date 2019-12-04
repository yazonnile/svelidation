import Page from 'helpers/page';
const page = new Page();

fixture `cold start`
  .page `http://localhost:4411/?test=default`;

test('should show errors on form submit', async t => {
  await t
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .expect(page.errors.count).eql(1)
    .expect(page.errors.withExactText('min')).ok()
});
