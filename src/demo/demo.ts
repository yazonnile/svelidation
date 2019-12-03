import Demo from './demo.svelte';
import Dynamic from './dynamic.svelte';
import { SvelidationPhaseEnum } from 'lib/typing/typing';

const target = document.getElementById('app');

new Demo({
  target,
  props: {
    title: 'Validation by <mark>change</mark> event after form <mark>submit</mark>',
    defaultSettings: true,
    options: {
      validateOn: ['change'],
      clearOn: ['reset'],
      inputValidationPhase: SvelidationPhaseEnum.afterFirstValidation
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
      inputValidationPhase: SvelidationPhaseEnum.always
    }
  }
});

new Demo({
  target,
  props: {
    title: '<mark>submit</mark> only validation',
    options: {
      inputValidationPhase: SvelidationPhaseEnum.never
    }
  }
});

new Dynamic({ target });
