import Page from 'helpers/page';
import { Selector } from 'testcafe';
const page = new Page();

fixture `api clearErrors`
  .page `http://localhost:4411/?test=api-clear-errors`;

test('should clear errors', async t => {
  const customError = Selector('#forth-error');
  await t
    .expect(page.forms.exists).ok()
    .expect(page.errors.count).eql(0)
    .expect(customError.exists).ok()
    .expect(page.inputs.count).eql(3)
    .click(page.submitButton)
    .expect(page.errors.count).eql(4)
    .expect(customError.exists).ok()
    .click(page.primaryButton)
    .expect(page.errors.count).eql(0)
    .expect(customError.exists).ok()
    .click(page.secondaryButton)
    .expect(customError.exists).notOk();
});
