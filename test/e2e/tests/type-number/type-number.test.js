import Page, { blur } from 'helpers/page';
const page = new Page();

fixture `type number`
  .page `http://localhost:4411/?test=type-number`;

test('type rule', async t => {
  await t
    .click(page.slideButton.withExactText('type'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '1');
  await blur();
  await t
    .expect(page.errors.exists).notOk();
});

test('min rule', async t => {
  await t
    .click(page.slideButton.withExactText('min'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '2');
  await blur();
  await t
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '2');
  await blur();
  await t
    .expect(page.errors.exists).notOk();
});

test('max rule', async t => {
  await t
    .click(page.slideButton.withExactText('max'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '2');
  await blur();
  await t
    .expect(page.errors.exists).notOk()
    .typeText(page.inputs, '3');
  await blur();
  await t
    .expect(page.errors.exists).ok();
});

test('between rule', async t => {
  await t
    .click(page.slideButton.withExactText('between'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '4');
  await blur();
  await t
    .expect(page.errors.exists).notOk();
});
