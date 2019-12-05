import Page, { blur } from 'helpers/page';
const page = new Page();

fixture `option includeAllEntries`
  .page `http://localhost:4411/?test=option-include-all-entries`;

const runTest = (btnName, errorsCount) => {
  test(btnName, async t => {
    await t
      .click(page.slideButton.withExactText(btnName))
      .expect(page.forms.exists).ok()
      .expect(page.errors.exists).notOk()
      .click(page.submitButton)
      .expect(page.errors.count).eql(errorsCount)
  });
};

runTest('default', 1);
runTest('true', 2);
runTest('false', 1);
