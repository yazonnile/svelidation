import Page from 'page';
const page = new Page();

fixture `option inputValidationPhase`
  .page `http://localhost:4411/?test=option-input-validation-phase`;

test('should validate after submit', async t => {
  await t
    .click(page.slideButton.withExactText('default'))
    .expect(page.forms.exists).ok()
    .typeText(page.inputs, '12')
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '12345')
    .expect(page.errors.exists).notOk();
});

test('shouldn\'t validate with 0 option', async t => {
  await t
    .click(page.slideButton.withExactText('never'))
    .expect(page.forms.exists).ok()
    .typeText(page.inputs, '12')
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '12345')
    .expect(page.errors.exists).ok();
});

test('should always validate with 1 option', async t => {
  await t
    .click(page.slideButton.withExactText('always'))
    .expect(page.forms.exists).ok()
    .typeText(page.inputs, '12')
    .expect(page.errors.exists).ok()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '12345')
    .expect(page.errors.exists).notOk();
});
