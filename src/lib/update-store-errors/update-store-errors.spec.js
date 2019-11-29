import updateStoreErrors from './update-store-errors';
import { writable, get } from 'svelte/store';

describe('updateStoreErrors', () => {
  const getStoreValue = (store, value) => get(store)[value];

  it('should update errors value', () => {
    const store = writable({ errors: [], value: 1 });
    updateStoreErrors(store, ['1']);
    expect(getStoreValue(store, 'errors')).toEqual(['1']);
    updateStoreErrors(store, ['3', '4']);
    expect(getStoreValue(store, 'errors')).toEqual(['3', '4']);
  });

  it('should set empty array to errors', () => {
    const store = writable({ errors: [], value: 1 });
    updateStoreErrors(store, ['1']);
    expect(getStoreValue(store, 'errors')).toEqual(['1']);
    updateStoreErrors(store);
    expect(getStoreValue(store, 'errors')).toEqual([]);
  });
});
