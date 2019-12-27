import Page, { blur } from 'helpers/page';
import { Selector } from 'testcafe';
const page = new Page();

fixture `option useCustomErrorsStore`
  .page `http://localhost:4411/?test=option-use-custom-errors-store`;

const runTest = (btnName, errorsValuesCount) => {
  test(btnName, async t => {
    const success = Selector('.success');
    await t
      .click(page.slideButton.withExactText(btnName))
      .expect(page.forms.exists).ok()
      .expect(page.errors.exists).notOk()
      .click(page.submitButton)
      .expect(page.errors.count).eql(6)
      .expect(page.errorsValues.count).eql(errorsValuesCount)
      .expect(success.exists).notOk()
      .typeText(page.inputs.nth(0), '12345')
      .typeText(page.inputs.nth(1), '1234')
      .typeText(page.inputs.nth(2), '123456')
      .typeText(page.inputs.nth(3), '1');
    await blur();
    await t.click(page.submitButton)
      .expect(page.errors.count).eql(0)
      .expect(success.exists).ok();
  });
};

runTest('default', 0);
runTest('custom', 6);
