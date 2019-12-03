import { getSpies, SvelidationSpy } from './spy/spy';
import { SvelidationRule, SvelidationRulesStore, getType, getRule } from './types/types';

interface SvelidationValidatorParams {
  type: string;
  optional?: boolean;
  required?: boolean;
  trim?: boolean;

  minLength?: number;
  maxLength?: number;
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

  return { errors, stop };
};

const getScope = ({ type, optional, ...rules }: SvelidationValidatorParams): SvelidationRulesStore => {
  const typeRules = getType(type);

  if (!typeRules) {
    return {};
  }

  return [...Object.keys(rules), 'typeCheck'].reduce((rules, ruleName) => {
    const rule = typeRules[ruleName] || getRule(ruleName);
    if (rule) {
      rules[ruleName] = rule;
    } else {
      console.warn('svelidation: rule is not defined', ruleName);
    }

    return rules;
  }, {});
};

const skipValidation = (value: any, { optional, required = false }): boolean => {
  const valueIsAbsent = [undefined, null, ''].indexOf(value) > -1;
  const valueIsOptional = typeof optional === 'boolean' ? optional : !required;
  return valueIsAbsent && valueIsOptional;
};

const validate = (value: any, validateParams: SvelidationValidatorParams): string[]|void => {
  const { trim = false, ...params } = validateParams;

  if (trim && typeof value === 'string') {
    value = (value as string).trim();
  }

  const { required, optional, type } = params;
  const globalSpies = getSpies();
  const typeSpies = getSpies({ type });
  const { typeCheck, ...scope } = getScope(params);

  if (skipValidation(value, { required, optional }) && !Object.keys(scope).length) {
    return [];
  }

  if (typeof typeCheck !== 'function') {
    console.warn('svelidation: typeCheck method is absent for type', params.type);
    return [];
  } else {
    const typeCheckSpies = getSpies({ ruleName: 'typeCheck' });
    const { stop, errors, abort } = runRuleWithSpies({
      value, params,
      rule: typeCheck,
      ruleName: 'typeCheck',
      spies: [...globalSpies, ...typeSpies, ...typeCheckSpies]
    });

    if (abort) {
      return;
    }

    if (errors.length || stop) {
      return errors;
    }
  }

  const result = [];
  const ruleNames = Object.keys(scope);

  for (let i = 0; i < ruleNames.length; i++) {
    const typeRuleSpies = getSpies({ type, ruleName: ruleNames[i] });
    const ruleSpies = getSpies({ ruleName: ruleNames[i] });
    const { stop, errors, abort } = runRuleWithSpies({
      value, params,
      rule: scope[ruleNames[i]],
      ruleName: ruleNames[i],
      spies: [...globalSpies, ...typeSpies, ...typeRuleSpies,  ...ruleSpies]
    });

    if (abort) {
      return;
    }

    if (stop) {
      return errors;
    } else {
      result.push(...errors);
    }
  }

  return result;
};

export { validate };
