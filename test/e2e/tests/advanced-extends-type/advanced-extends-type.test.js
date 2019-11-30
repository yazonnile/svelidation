import Page, { blur } from 'helpers/page';
const page = new Page();

fixture `advanced extends type`
  .page `http://localhost:4411/?test=advanced-extends-type`;

test('should make all strings minLength 4 by type check', async t => {
  await t
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.count).eql(1)
    .typeText(page.inputs, '1234');
  await blur();
  await t
    .expect(page.errors.count).eql(0);
});
