import { Selector, ClientFunction } from 'testcafe';

export default class Page {
  constructor () {
    this.forms = Selector('form');
    this.labels = this.forms.find('label');
    this.inputs = this.forms.find('input');
    this.errors = this.forms.find('p.error');
    this.submitButton = this.forms.find('[type="submit"]');
    this.slideButton = Selector('button.slide-button');
  }
}

export const focus = ClientFunction(() => {
  document.querySelector('input').focus();
});

export const blur = ClientFunction(() => {
  document.activeElement.blur();
});
