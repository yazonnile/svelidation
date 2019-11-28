import Page from 'page';
const page = new Page();

fixture `advanced update type`
  .page `http://localhost:4411/?test=advanced-extends-type`;

test('should make all strings minLength 4 by type check', async t => {
  await t
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.count).eql(1)
    .typeText(page.inputs, '1234')
    .expect(page.errors.count).eql(0);
});
