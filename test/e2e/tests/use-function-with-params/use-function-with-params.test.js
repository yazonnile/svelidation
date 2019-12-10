import Page, {blur} from 'helpers/page';
const page = new Page();

fixture `use function`
  .page `http://localhost:4411/?test=use-function-with-params`;

test('Custom input options should override default', async t => {
  await t
    .expect(page.forms.exists).ok()
    .typeText(page.inputs.nth(0), '12')
    .typeText(page.inputs.nth(1), '12')
    .click(page.submitButton)
    .expect(page.errors.count).eql(2)
    .typeText(page.inputs.nth(1), '12345')
    .expect(page.errors.count).eql(1)
    .typeText(page.inputs.nth(0), '12345')
    .expect(page.errors.count).eql(1);
});
