import Page, { blur } from 'helpers/page';
const page = new Page();

fixture `option listenInputEvents`
  .page `http://localhost:4411/?test=option-listen-input-events`;

test('should validate after submit', async t => {
  await t
    .click(page.slideButton.withExactText('default'))
    .expect(page.forms.exists).ok()
    .typeText(page.inputs, '12');
  await blur();
  await t
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '12345');
  await blur();
  await t
    .expect(page.errors.exists).notOk();
});

test('shouldn\'t validate with 0 option', async t => {
  await t
    .click(page.slideButton.withExactText('never'))
    .expect(page.forms.exists).ok()
    .typeText(page.inputs, '12');
  await blur();
  await t
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '12345');
  await blur();
  await t
    .expect(page.errors.exists).ok();
});

test('should always validate with 1 option', async t => {
  await t
    .click(page.slideButton.withExactText('always'))
    .expect(page.forms.exists).ok()
    .typeText(page.inputs, '12');
  await blur();
  await t
    .expect(page.errors.exists).ok()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '12345');
  await blur();
  await t
    .expect(page.errors.exists).notOk();
});
