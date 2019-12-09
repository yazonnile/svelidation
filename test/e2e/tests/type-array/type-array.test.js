import Page from 'helpers/page';
const page = new Page();

fixture `type array`
  .page `http://localhost:4411/?test=type-array`;

test('default', async t => {
  await t
    .click(page.slideButton.withExactText('default'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok();
});

test('required', async t => {
  await t
    .click(page.slideButton.withExactText('required'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .click(page.inputs.nth(0))
    .expect(page.errors.exists).notOk();
});

test('min', async t => {
  await t
    .click(page.slideButton.withExactText('min'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .click(page.inputs.nth(0))
    .expect(page.errors.exists).ok()
    .click(page.inputs.nth(1))
    .expect(page.errors.exists).notOk();
});

test('max', async t => {
  await t
    .click(page.slideButton.withExactText('max'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .click(page.inputs.nth(0))
    .expect(page.errors.exists).notOk()
    .click(page.inputs.nth(1))
    .expect(page.errors.exists).ok();
});

test('equal', async t => {
  await t
    .click(page.slideButton.withExactText('equal'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .click(page.inputs.nth(0))
    .expect(page.errors.exists).ok()
    .click(page.inputs.nth(2))
    .expect(page.errors.exists).notOk();
});

test('includes', async t => {
  await t
    .click(page.slideButton.withExactText('includes'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .click(page.inputs.nth(0))
    .expect(page.errors.exists).ok()
    .click(page.inputs.nth(1))
    .expect(page.errors.exists).notOk();
});
