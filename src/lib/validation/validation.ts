import StringType from './types/string';
import NumberType from './types/number';
import EmailType from './types/email';
import BaseType from './types/base';
import { EntryParamsInterface, ErrorsType } from 'lib/typing/typing';
export { BaseType, StringType, EmailType, NumberType };

const validators = {
  string: StringType,
  number: NumberType,
  email: EmailType
};

const getRuleKeys = (params: EntryParamsInterface): string[] => {
  const { type, value, trim, optional, ...rest } = params;
  return Object.keys(rest);
};

export const addValidator = (key: string, typeClass) => {
  validators[key] = typeClass;
};

export default (value: string, params: EntryParamsInterface): ErrorsType => {
  const { type } = params;
  const validatorClass = validators[type];

  if (!validatorClass) {
    console.warn(`validatorDoesntExist`);
    return [];
  }

  const instance = new validatorClass(value, params);

  // field is optional with empty value
  if (instance.optionalWithNoValue()) {
    return [];
  }

  const ruleKeys = getRuleKeys(params);
  if (ruleKeys.length) {
    return ruleKeys.reduce((errors, ruleKey) => {
      const ruleMethod = `${ruleKey}Rule`;

      if (typeof instance[ruleMethod] === 'function') {
        if (!instance[ruleMethod]()) {
          errors.push(`${ruleKey}`);
        }
      } else {
        console.warn(`${type}::ruleDoesntExist::${ruleKey}`);
      }

      return errors;
    }, []);
  } else {
    if (typeof instance.typeValidation === 'function') {
      return instance.typeValidation() ? [] : ['type'];
    } else {
      console.warn(`${type}::typeValidationDoesntExist`);
      return [];
    }
  }
};
