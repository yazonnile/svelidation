import { SvelidationStoreType } from 'lib/typing/typing';

export default (store: SvelidationStoreType, errors: any[] = []) => {
  store.update(value => {
    return { ...value, errors };
  });
};
