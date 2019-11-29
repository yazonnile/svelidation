import { ErrorsType, StoreType } from 'lib/typing/typing';

export default (store: StoreType, errors: ErrorsType = []) => {
  store.update(value => {
    return { ...value, errors };
  });
};
