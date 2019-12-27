import Page from 'helpers/page';
import { Selector } from 'testcafe';
const page = new Page();
const result = Selector('.result');

fixture `api getValues`
  .page `http://localhost:4411/?test=api-get-values`;

test('default', async t => {
  await t
    .click(page.slideButton.withExactText('default'))
    .expect(page.forms.exists).ok()
    .click(page.submitButton)
    .expect(result.count).eql(2)
    .expect(result.nth(0).withText('value1').exists).ok()
    .expect(result.nth(1).withText('value2@aa.aa').exists).ok();
});

test('id', async t => {
  await t
    .click(page.slideButton.withExactText('id'))
    .expect(result.count).eql(2)
    .expect(result.nth(0).withText('value1').exists).ok()
    .expect(result.nth(1).withText('value2@aa.aa').exists).ok();
});

test('custom', async t => {
  await t
    .click(page.slideButton.withExactText('custom'))
    .expect(result.count).eql(2)
    .expect(result.nth(0).withText('value1').exists).ok()
    .expect(result.nth(1).withText('value2@aa.aa').exists).ok();
});
