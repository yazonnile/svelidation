import { SvelidationValue, SvelidationRule } from '../types/types';

interface SvelidationInterceptor<T = SvelidationValue, R = boolean> {(
  value: T,
  params: {
    type?: string,
    ruleName?: string,
    [key: string]: any
  },
  next: SvelidationRule<T, void>,
  abort: () => void,
): string[] | void}

interface SvelidationInterceptorStore {
  [key: string]: SvelidationInterceptor[]
}

type SvelidationInterceptorParams = {
  type?: string,
  ruleName?: string,
};

const globals: SvelidationInterceptor[] = [];
const typeRules: {[key: string]: SvelidationInterceptorStore} = {};
const types: SvelidationInterceptorStore = {};
const rules: SvelidationInterceptorStore = {};

const addInterceptor = (
  interceptor: SvelidationInterceptor,
  params?: SvelidationInterceptorParams,
): SvelidationInterceptor[] => {
  if (!params) {
    return globals.push(interceptor) && globals;
  }

  const { type, ruleName } = params;
  if (type && ruleName) {
    if (!typeRules[type]) typeRules[type] = {};
    if (!typeRules[type][ruleName]) typeRules[type][ruleName] = [];
    return typeRules[type][ruleName].push(interceptor) && typeRules[type][ruleName];
  } else {
    const list = type ? types : rules;
    const key = type || ruleName;
    if (!list[key]) list[key] = [];
    return list[key].push(interceptor) && list[key];
  }
};

const getInterceptors = (params?): SvelidationInterceptor[] => {
  if (!params || typeof params === 'function') {
    return globals;
  }

  try {
    const { type: typeName, ruleName } = params;
    if (typeName && ruleName) {
      return typeRules[typeName][ruleName];
    } else if (typeName) {
      return types[typeName];
    } else {
      return rules[ruleName];
    }
  } catch (e) {
    return;
  }
};

const removeInterceptor = (
  interceptor: SvelidationInterceptor,
  params?: SvelidationInterceptorParams,
): boolean => {
  const list = getInterceptors(params);

  if (!list) {
    return false;
  }

  const interceptorPosition = list.indexOf(interceptor);
  return list.splice(interceptorPosition, interceptorPosition === -1 ? 0 : 1).length > 0;
};

const clearInterceptors = (
  params?: SvelidationInterceptorParams
): boolean => {
  const list = getInterceptors(params);

  if (!list || list.length === 0) {
    return false;
  }

  list.length = 0;
  return true;
};

export { addInterceptor, removeInterceptor, clearInterceptors, getInterceptors, SvelidationInterceptor };
