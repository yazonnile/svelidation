import Page, { blur } from 'helpers/page';
const page = new Page();

fixture `option presence`
  .page `http://localhost:4411/?test=option-presence`;

test('required', async t => {
  await t
    .click(page.slideButton.withExactText('required'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .typeText(page.inputs.nth(0), 'asc.asc')
    .typeText(page.inputs.nth(1), 'aaa@asc.asc')
    .typeText(page.inputs.nth(4), '1')
    .click(page.submitButton)
    .expect(page.errors.count).eql(4);
});

test('optional', async t => {
  await t
    .click(page.slideButton.withExactText('optional'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .typeText(page.inputs.nth(0), 'asc.asc')
    .typeText(page.inputs.nth(1), 'aaa@asc.asc')
    .typeText(page.inputs.nth(4), '1')
    .click(page.submitButton)
    .expect(page.errors.count).eql(2);
});

test('mix', async t => {
  await t
    .click(page.slideButton.withExactText('mix'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.count).eql(1);
});
