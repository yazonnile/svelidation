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

test('minValue rule', async t => {
  await t
    .click(page.slideButton.withExactText('minValue'))
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

test('maxValue rule', async t => {
  await t
    .click(page.slideButton.withExactText('maxValue'))
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
