import Page, { blur } from 'helpers/page';
const page = new Page();

fixture `rule equal (function)`
  .page `http://localhost:4411/?test=rule-equal-function`;

test('fields equal', async t => {
  await t
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.count).eql(3)
    .typeText(page.inputs.nth(0), '122')
    .click(page.submitButton)
    .expect(page.errors.count).eql(2)
    .typeText(page.inputs.nth(1), '122')
    .click(page.submitButton)
    .expect(page.errors.count).eql(0);
});
