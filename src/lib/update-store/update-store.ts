import { StoreType } from 'lib/typing/typing';

export default (store: StoreType, newObj) => {
  store.update(value => {
    return {
      ...value,
      ...newObj
    };
  });
};
