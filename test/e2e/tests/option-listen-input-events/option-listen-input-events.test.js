import Page, { blur } from 'helpers/page';
const page = new Page();

fixture `option listenInputEvents`
  .page `http://localhost:4411/?test=option-listen-input-events`;

test('should validate after submit', async t => {
  await t
    .click(page.slideButton.withExactText('default'))
    .expect(page.forms.exists).ok()
    .typeText(page.inputs.nth(0), '12')
    .typeText(page.inputs.nth(1), '12');
  await blur();
  await t
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs.nth(0), '12345');
  await blur();
  await t
    .expect(page.errors.count).eql(1)
    .typeText(page.inputs.nth(1), '12345')
    .expect(page.errors.count).eql(0);
});

test('shouldn\'t validate with 0 option', async t => {
  await t
    .click(page.slideButton.withExactText('never'))
    .expect(page.forms.exists).ok()
    .typeText(page.inputs.nth(0), '12')
    .typeText(page.inputs.nth(1), '12');
  await blur();
  await t
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs.nth(0), '12345');
  await blur();
  await t
    .expect(page.errors.count).eql(2)
    .typeText(page.inputs.nth(1), '12345')
    .expect(page.errors.count).eql(2);
});

test('should always validate with 1 option', async t => {
  await t
    .click(page.slideButton.withExactText('always'))
    .expect(page.forms.exists).ok()
    .typeText(page.inputs.nth(0), '12')
    .typeText(page.inputs.nth(1), '12');
  await blur();
  await t
    .expect(page.errors.exists).ok()
    .typeText(page.inputs.nth(0), '123')
    .typeText(page.inputs.nth(1), '123')
    .expect(page.errors.exists).notOk();
});
