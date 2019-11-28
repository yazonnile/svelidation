import Page from 'page';
const page = new Page();

fixture `api createEntries`
  .page `http://localhost:4411/?test=api-create-entries`;

const run = (id) => {
  test(`should work with ${id}`, async t => {
    await t
      .click(page.slideButton.withExactText(id))
      .expect(page.forms.exists).ok()
      .expect(page.inputs.count).eql(2)
      .expect(page.errors.exists).notOk()
      .click(page.submitButton)
      .expect(page.errors.count).eql(2);
  });
};

run('array');
run('object');
