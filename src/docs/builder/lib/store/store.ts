import { writable } from 'svelte/store';

export default <Type, ReturnType>(value, methods): ReturnType => {
  const store = writable<Type>(value);
  const methodsKeys = Object.keys(methods);

  return {
    subscribe: store.subscribe,
    ...methodsKeys.reduce((result, key) => {
      result[key] = (...args) => {
        return methods[key](store, ...args);
      };

      return result;
    }, {})
  } as any
};
