import Demo from './components/demo.svelte';
import Dynamic from './components/dynamic.svelte';
import Radios from './components/radios.svelte';
import Array from './components/array.svelte';
import { ListenInputEventsEnum } from 'lib/typing/typing';

const target = document.getElementById('app');

new Array({
  target,
  props: {
    title: 'Array example',
    options: {
      validateOn: ['change'],
      clearOn: ['reset'],
      listenInputEvents: ListenInputEventsEnum.afterValidation
    }
  }
});

new Demo({
  target,
  props: {
    title: 'Validation by <mark>change</mark> event after form <mark>submit</mark>',
    defaultSettings: true,
    options: {
      validateOn: ['change'],
      clearOn: ['reset'],
      listenInputEvents: ListenInputEventsEnum.afterValidation
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
      listenInputEvents: ListenInputEventsEnum.always
    }
  }
});

new Demo({
  target,
  props: {
    title: '<mark>submit</mark> only validation',
    options: {
      listenInputEvents: ListenInputEventsEnum.never
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
      listenInputEvents: ListenInputEventsEnum.afterValidation
    }
  }
});
