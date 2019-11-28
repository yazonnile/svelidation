import Demo from './demo/demo.svelte';
import Dynamic from './demo/dynamic.svelte';
import Custom from './demo/custom.svelte';
import { PhaseEnum } from 'lib/typing/typing';

new Demo({
  target: document.body,
  props: {
    title: '<mark>input</mark> event after form <mark>submit</mark>',
    defaultSettings: true,
    options: {
      validateOn: ['input'],
      clearOn: ['reset'],
      inputValidationPhase: PhaseEnum.afterFirstValidation
    }
  }
});

new Demo({
  target: document.body,
  props: {
    title: '<mark>blur</mark> / <mark>focus</mark> events <mark>always</mark>',
    options: {
      validateOn: ['blur'],
      clearOn: ['focus'],
      inputValidationPhase: PhaseEnum.always
    }
  }
});

new Demo({
  target: document.body,
  props: {
    title: '<mark>submit</mark> only validation',
    options: {
      inputValidationPhase: PhaseEnum.never
    }
  }
});

new Dynamic({
  target: document.body,
});

new Custom({
  target: document.body,
});
