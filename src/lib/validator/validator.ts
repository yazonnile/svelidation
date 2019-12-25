import { getSpies, SvelidationSpy } from './spy/spy';
import { SvelidationRule, SvelidationRulesStore, getType, getRule } from './types/types';
import isFunction from 'lib/is-function/is-function';

export interface SvelidationValidatorParams {
  type: string;
  optional?: boolean;
  required?: boolean;
  trim?: boolean;

  min?: number;
  max?: number;
  equal?: any;
  match?: RegExp;

  [key: string]: any;
}

interface SvelidationRunWithSpies {(
  params: {
    value: any,
    params: SvelidationValidatorParams,
    rule: SvelidationRule,
    ruleName: string,
    spies: SvelidationSpy[]
  }
)}

interface SvelidationRunWithSpiesResult {
  errors?: string[],
  stop?: boolean,
  abort?: boolean,
  nextValue?: any,
  nextParams?: any
}

const runRuleWithSpies: SvelidationRunWithSpies = ({ value, params: initialParams, rule, ruleName, spies }): SvelidationRunWithSpiesResult => {
  const errors = [];
  const { type } = initialParams;
  let nextValue = value;
  let nextParams = initialParams;
  let stop = false;
  let abort = false;

  for (let i = 0; i < spies.length; i++) {
    stop = true;
    const spyErrors = spies[i](nextValue, { type, ruleName, ...nextParams }, (value, params = {}) => {
      nextValue = value;
      nextParams = { ...initialParams, ...params };
      stop = false;
    }, () => {
      abort = true;
    });

    if (abort) {
      return { abort };
    }

    if (Array.isArray(spyErrors)) {
      errors.push(...spyErrors);
    }

    if (stop) {
      break;
    }
  }

  if (!stop && !rule(nextValue, nextParams)) {
    errors.push(ruleName);
  }

  return { errors, stop, nextValue, nextParams };
};

const getScope = ({ type, optional, ...rules }: SvelidationValidatorParams): SvelidationRulesStore => {
  const typeRules = getType(type);

  if (!typeRules) {
    return {};
  }

  return [...Object.keys(rules), 'type'].reduce((obj, ruleName) => {
    const rule = typeRules[ruleName] || getRule(ruleName);
    if (rule) {
      obj[ruleName] = rule;
    } else {
      if (process.env.DEV) {
        console.warn('svelidation: rule is not defined', ruleName);
      }
    }

    return obj;
  }, {});
};

const skipValidation = (value: any, { optional, required = false }): boolean => {
  const valueIsAbsent = [undefined, null, ''].indexOf(value) > -1 || (Array.isArray(value) && !value.length);
  const valueIsOptional = typeof optional === 'boolean' ? optional : !required;
  return valueIsAbsent && valueIsOptional;
};

const validate = (value: any, validateParams: SvelidationValidatorParams): string[]|void => {
  let { trim = false, ...params } = validateParams;

  if (trim && typeof value === 'string') {
    value = (value as string).trim();
  }

  const { required, optional, type } = params;
  const globalSpies = getSpies();
  const typeSpies = getSpies({ type });
  const scope = getScope(params);

  // no type - no party
  if (!isFunction(scope.type)) {
    if (process.env.DEV) {
      console.warn('svelidation: type method is absent for type', params.type);
    }
    return [];
  }

  // skip for empty and optional fields
  if (skipValidation(value, { required, optional })) {
    return [];
  }

  const result = [];

  // ensure type with first pick
  const ruleNames = Object.keys(scope).filter(key => (key !== 'type'));
  ruleNames.unshift('type');

  for (let i = 0; i < ruleNames.length; i++) {
    const typeRuleSpies = getSpies({ type, ruleName: ruleNames[i] });
    const ruleSpies = getSpies({ ruleName: ruleNames[i] });
    const spies = [];

    if (i === 0) {
      spies.push(...globalSpies);
      spies.push(...typeSpies);
    }

    spies.push(...typeRuleSpies);
    spies.push(...ruleSpies);

    const { stop, errors, abort, nextValue, nextParams } = runRuleWithSpies({
      value, params, spies,
      rule: scope[ruleNames[i]],
      ruleName: ruleNames[i]
    });

    // exit validation with no errors in case of abort call
    if (abort) {
      return;
    }

    // stop validation with current errors in case of stop call
    // or if there are errors on first (type) step
    if (stop || (i === 0 && errors.length)) {
      return errors;
    }

    result.push(...errors);
    value = nextValue;
    params = nextParams;
  }

  return result;
};

export { validate };
export { addSpy, removeSpies } from './spy/spy';
export { ensureRule, ensureType, resetType, resetRule } from './types/types';
