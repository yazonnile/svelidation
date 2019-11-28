import Page from 'page';
const page = new Page();

fixture `api createForm`
  .page `http://localhost:4411/?test=api-create-form`;

test(`should invoke onSubmit events`, async t => {
  await t
    .click(page.slideButton.withExactText('submit'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.log.withExactText('submit,')).ok()
    .click(page.submitButton)
    .expect(page.log.withExactText('submit,submit,')).ok();
});

test(`should invoke onFail and onSuccess events`, async t => {
  await t
    .click(page.slideButton.withExactText('successFail'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.log.withExactText('fail,')).ok()
    .typeText(page.inputs, '1234')
    .expect(page.log.withExactText('fail,success,')).ok();
});
