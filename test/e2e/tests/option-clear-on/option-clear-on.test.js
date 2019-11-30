import Page, { focus, blur } from 'helpers/page';
const page = new Page();

fixture `option clearOn`
  .page `http://localhost:4411/?test=option-clear-on`;

test('should work reset only by default', async t => {
  await t
    .click(page.slideButton.withExactText('default'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok();
  await focus();
  await t
    .expect(page.errors.exists).ok()
    .click(page.resetButton)
    .expect(page.errors.exists).notOk();
});

test('should work by focus', async t => {
  await t
    .click(page.slideButton.withExactText('focus'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok();
  await focus();
  await t
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .click(page.resetButton)
    .expect(page.errors.exists).ok()
});

test('should work by focus, change, reset', async t => {
  await t
    .click(page.slideButton.withExactText('focus-change-reset'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok();
  await focus();
  await t
    .expect(page.errors.exists).notOk()
    .typeText(page.inputs, '12');
  await blur();
  await t
    .expect(page.errors.exists).notOk()
});
