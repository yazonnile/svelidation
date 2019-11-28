import Page from 'page';
const page = new Page();

fixture `type base`
  .page `http://localhost:4411/?test=type-base`;

test('optional rule', async t => {
  await t
    .click(page.slideButton.withExactText('optional'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).notOk()
    .typeText(page.inputs, '1')
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, '23')
    .expect(page.errors.exists).notOk();
});

test('match rule', async t => {
  await t
    .click(page.slideButton.withExactText('match'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, 'testma')
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, 'tch')
    .expect(page.errors.exists).notOk();
});

test('equal rule', async t => {
  await t
    .click(page.slideButton.withExactText('equal'))
    .expect(page.forms.exists).ok()
    .expect(page.errors.exists).notOk()
    .click(page.submitButton)
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, 'hel')
    .expect(page.errors.exists).ok()
    .typeText(page.inputs, 'lo')
    .expect(page.errors.exists).notOk();
});
