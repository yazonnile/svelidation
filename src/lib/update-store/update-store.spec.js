import updateStore from './update-store';
import store from 'svelte/store';

describe("lib:updateStore", function() {
  const getStoreObj = store => store.get(store);

  it("should update with any object", function() {
    const store = store.writable({ a: 1, b: 2 });
    expect(getStoreObj(store)).toEqual(jasmine.objectContaining({ a: 1, b: 2 }));
    expect(getStoreObj(store)).not.toEqual(jasmine.objectContaining({ c: 3 }));
  });
});
