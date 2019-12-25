import Page, { blur } from 'helpers/page';
const page = new Page();

fixture `option useCustomErrorsStore`
  .page `http://localhost:4411/?test=option-use-custom-errors-store`;

const runTest = (btnName, errorsValuesCount) => {
  test(btnName, async t => {
    await t
      .click(page.slideButton.withExactText(btnName))
      .expect(page.forms.exists).ok()
      .expect(page.errors.exists).notOk()
      .click(page.submitButton)
      .expect(page.errors.count).eql(6)
      .expect(page.errorsValues.count).eql(errorsValuesCount);
  });
};

runTest('default', 0);
runTest('custom', 6);
