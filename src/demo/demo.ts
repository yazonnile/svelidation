import Demo from './demo.svelte';
import Dynamic from './dynamic.svelte';
import Radios from './radios.svelte';
import { SvelidationPhase } from 'lib/typing/typing';

const target = document.getElementById('app');

new Demo({
  target,
  props: {
    title: 'Validation by <mark>change</mark> event after form <mark>submit</mark>',
    defaultSettings: true,
    options: {
      validateOn: ['change'],
      clearOn: ['reset'],
      listenInputEvents: SvelidationPhase.afterValidation
    }
  }
});

new Demo({
  target,
  props: {
    title: 'Validation by <mark>blur</mark> / <mark>focus</mark> events <mark>always</mark>',
    options: {
      validateOn: ['blur'],
      clearOn: ['focus'],
      listenInputEvents: SvelidationPhase.always
    }
  }
});

new Demo({
  target,
  props: {
    title: '<mark>submit</mark> only validation',
    options: {
      listenInputEvents: SvelidationPhase.never
    }
  }
});

new Dynamic({ target });

new Radios({
  target,
  props: {
    title: 'Radios example',
    options: {
      validateOn: ['change'],
      clearOn: ['reset'],
      listenInputEvents: SvelidationPhase.afterValidation
    }
  }
});
