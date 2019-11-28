import Page from 'page';
const page = new Page();

fixture `advanced addValidator`
  .page `http://localhost:4411/?test=advanced-add-validator`;

test('should validate by type of new validator', async t => {
  await t
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.count).eql(1)
    .typeText(page.inputs, 'AAA')
    .expect(page.errors.count).eql(0)
    .typeText(page.inputs, 'AAA')
    .expect(page.errors.count).eql(1);
});
