import { Selector } from 'testcafe';

fixture `Search widget`
  .page `http://localhost:8040/pages/lolka.html`;

test('Title', async t => {
  await t
    .expect(Selector("title").innerText).eql('Aloha')
});
