import { Selector, ClientFunction } from 'testcafe';

export default class Page {
  constructor () {
    this.forms = Selector('form');
    this.labels = Selector('label');
    this.inputs = this.labels.find('input');
    this.errors = this.labels.find('p.error');
    this.submitButton = this.forms.find('[type="submit"]');
    this.slideButton = Selector('button.slide-button');
    this.mainActionButton = Selector('#main-action');
    this.log = Selector('.log');
  }
}

export const focus = ClientFunction(() => {
  document.querySelector('input').focus();
});

export const blur = ClientFunction(() => {
  document.activeElement.blur();
});
