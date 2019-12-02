import { getInterceptors, SvelidationInterceptor } from './interceptor/interceptor';
import { SvelidationValue, SvelidationRule, SvelidationRulesStore, getType, getRule } from './types/types';

interface SvelidationValidatorParams {
  type: string;
  optional?: boolean;
  required?: boolean;
  trimValue?: boolean;

  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  equal?: SvelidationValue;
  match?: RegExp;

  [key: string]: SvelidationValue;
}

interface SvelidationRunWithInterceptors {(
  params: {
    value: SvelidationValue,
    params: SvelidationValidatorParams,
    rule: SvelidationRule,
    ruleName: string,
    interceptors: SvelidationInterceptor[]
  }
)}

interface SvelidationRunWithInterceptorsResult {
  errors: string[],
  stop?: boolean
}

const runRuleWithInterceptors: SvelidationRunWithInterceptors = ({ value, params: initialParams, rule, ruleName, interceptors }): SvelidationRunWithInterceptorsResult => {
  const errors = [];
  const { type } = initialParams;
  let nextValue = value;
  let nextParams = initialParams;
  let stop = false;

  for (let i = 0; i < interceptors.length && !stop; i++) {
    stop = true;
    const interceptorErrors = interceptors[i](nextValue, { type, ruleName, ...nextParams }, (value, params = {}) => {
      nextValue = value;
      nextParams = { ...initialParams, ...params };
      stop = false;
    });

    if (Array.isArray(interceptorErrors)) {
      errors.push(...interceptorErrors);
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
  return Object.keys(rules).reduce((rules, ruleName) => {
    const rule = typeRules[ruleName] || getRule(ruleName);
    if (rule) {
      rules[ruleName] = rule;
    } else {
      console.warn('svelidation: rule is not defined', ruleName);
    }

    return rules;
  }, {});
};

const skipValidation = (value: any, { optional, required }): boolean => {
  const valueIsAbsent = [undefined, null, ''].indexOf(value) > -1;
  const valueIsOptional = typeof optional === 'boolean' ? optional : !required;
  return valueIsAbsent && valueIsOptional;
};

const validate = (value: SvelidationValue, validateParams: SvelidationValidatorParams): string[] => {
  const { trimValue = false, ...params } = validateParams;

  if (trimValue && typeof value === 'string') {
    value = (value as string).trim();
  }

  const { required, optional, type } = params;
  if (skipValidation(value, { required, optional })) {
    return [];
  }

  const globalInterceptors = getInterceptors();
  const typeInterceptors = getInterceptors({ type });
  const { typeCheck, ...scope } = getScope(params);

  if (typeof typeCheck !== 'function') {
    console.warn('svelidation: typeCheck method is absent for type', params.type);
    return [];
  } else {
    const typeCheckInterceptors = getInterceptors({ type, ruleName: 'typeCheck' });
    const { stop, errors } = runRuleWithInterceptors({
      value, params,
      rule: typeCheck,
      ruleName: 'typeCheck',
      interceptors: [...globalInterceptors, ...typeInterceptors, ...typeCheckInterceptors]
    });

    if (errors.length || stop) {
      return errors;
    }
  }

  const result = [];
  const ruleNames = Object.keys(scope);

  for (let i = 0; i < ruleNames.length; i++) {
    const typeRuleInterceptors = getInterceptors({ type, ruleName: ruleNames[i] });
    const ruleInterceptors = getInterceptors({ ruleName: ruleNames[i] });
    const { stop, errors } = runRuleWithInterceptors({
      value, params,
      rule: typeCheck,
      ruleName: ruleNames[i],
      interceptors: [...globalInterceptors, ...typeInterceptors, ...typeRuleInterceptors,  ...ruleInterceptors]
    });

    if (stop) {
      return errors;
    } else {
      result.push(...errors);
    }
  }

  return result;
};

export { validate };
