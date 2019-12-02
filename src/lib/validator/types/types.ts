type SvelidationValue = undefined | null | string | number | boolean | object | (string|number|boolean|undefined|null|object)[];

type SvelidationRule<Type = SvelidationValue, R = boolean> = {
  (value: Type, params?: {
    [key: string]: any
  }): R
}

type SvelidationType<Type> = {
  typeCheck: SvelidationRule<Type>;
  [key: string]: SvelidationRule<Type>;
}

type SvelidationTypesStore<Type = SvelidationValue> = {
  [key: string]: SvelidationType<Type>
}

type SvelidationRulesStore<Type = SvelidationValue> = {
  [key: string]: SvelidationRule<Type>
}

const types: SvelidationTypesStore | {} = {};
const rules: SvelidationRulesStore | {} = {};

const ensureType = <Type = SvelidationValue>(
  typeName: string,
  typeRules: SvelidationType<Type>
) => {
  if (!types[typeName]) {
    if (typeof typeRules.typeCheck !== 'function') {
      console.warn('svelidation: typeCheck method is required for new types', typeName);
      return;
    }

    types[typeName] = {};
  }

  Object.assign(types[typeName], typeRules);
};

ensureType<string>('string', {
  typeCheck: (value) => (typeof value === 'string'),
  minLength: (value, { minLength }) => (value.length >= minLength),
  maxLength: (value, { maxLength }) => (value.length >= maxLength),
});

ensureType<string>('email', {
  typeCheck: (value) => (typeof value === 'string' && !!(String(value)).match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
});

ensureType<number>('number', {
  typeCheck: (value) => !!(String(value)).match(/[\d.]+/),
  min: (value, { min }) => (value >= min),
  max: (value, { max }) => (value <= max),
});

const ensureRule = (ruleName: string, rule: SvelidationRule) => {
  Object.assign(rules, {
    [ruleName]: rule
  });
};

ensureRule('equal', (value, { equal }) => (value === equal));
ensureRule('match', (value, { match }) => !!(String(value)).match(match));
ensureRule('required', (value) => !!String(value));

const getType = (typeName) => types[typeName];
const getRule = (ruleName) => rules[ruleName];

export { ensureRule, ensureType, SvelidationValue, SvelidationRule, SvelidationRulesStore, getType, getRule };
