import { SvelidationRule } from '../types/types';

interface SvelidationSpy<T = any, R = boolean> {
  (
    value: T,
    params: {
      type?: string;
      ruleName?: string;
      [key: string]: any;
    },
    next: SvelidationRule<T, void>,
    abort: () => void,
  ): string[] | void;
}

interface SvelidationSpyStore {
  [key: string]: SvelidationSpy[];
}

type SvelidationSpyParams = {
  type?: string;
  ruleName?: string;
};

const globals: SvelidationSpy[] = [];
let typeRules: {[key: string]: SvelidationSpyStore} = {};
let types: SvelidationSpyStore = {};
let rules: SvelidationSpyStore = {};

const addSpy = (
  spy: SvelidationSpy,
  params?: SvelidationSpyParams,
): Function => {
  if (!params) {
    globals.push(spy);
  } else {
    const { type, ruleName } = params;
    if (type && ruleName) {
      if (!typeRules[type]) typeRules[type] = {};
      if (!typeRules[type][ruleName]) typeRules[type][ruleName] = [];
      typeRules[type][ruleName].push(spy);
    } else {
      const list = type ? types : rules;
      const key = type || ruleName;
      if (!list[key]) list[key] = [];
      list[key].push(spy);
    }
  }

  return () => removeSpy(spy, params);
};

const getSpies = (params?): SvelidationSpy[] => {
  if (!params) {
    return globals;
  }

  try {
    const { type: typeName, ruleName } = params;
    if (typeName && ruleName) {
      return typeRules[typeName][ruleName] || [];
    } else if (typeName) {
      return types[typeName] || [];
    } else {
      return rules[ruleName] || [];
    }
  } catch (e) {
    return [];
  }
};

interface SvelidationRemoveSpy {
  (
    spy: SvelidationSpy,
    params?: SvelidationSpyParams
  ): boolean;
}

const removeSpy: SvelidationRemoveSpy = (spy, params) => {
  const list = getSpies(params);

  if (!list) {
    return false;
  }

  const spyPosition = list.indexOf(spy);
  return list.splice(spyPosition, spyPosition === -1 ? 0 : 1).length > 0;
};

const removeSpies = (
  params?: SvelidationSpyParams
): boolean => {
  if (!params) {
    globals.length = 0;
    typeRules = {};
    types = {};
    rules = {};
    return true;
  }

  const list = getSpies(params);

  if (!list) {
    return false;
  }

  list.length = 0;
  return true;
};

export { addSpy, removeSpies, getSpies, removeSpy, SvelidationSpy };
