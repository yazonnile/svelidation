type SvelidationValue = undefined | null | string | number | boolean | object | (string|number|boolean|undefined|null|object)[];

type SvelidationRule<Type = SvelidationValue, R = boolean> = {
  (value: Type, params?: {
    [key: string]: any
  }): R
}

type SvelidationType<Type = SvelidationValue> = {
  typeCheck?: SvelidationRule<Type>;
  [key: string]: SvelidationRule<Type>;
}

type SvelidationTypesStore<Type = SvelidationValue> = {
  [key: string]: SvelidationType<Type>
}

type SvelidationRulesStore<Type = SvelidationValue> = {
  [key: string]: SvelidationRule<Type>
}

let types: SvelidationTypesStore | {} = {};
let rules: SvelidationRulesStore | {} = {};

const ensureType = <Type = SvelidationValue>(
  typeName: string,
  typeRules: SvelidationType<Type>
) => {
  if (!types[typeName]) {
    if (typeof typeRules !== 'object' || typeof typeRules.typeCheck !== 'function') {
      console.warn('svelidation: typeCheck method is required for new types', typeName);
      return;
    }

    types[typeName] = {};
  }

  Object.assign(types[typeName], typeRules);
};

const resetType = (typeName?: string) => {
  if (!typeName) {
    types = {};
    Object.keys(installType).forEach(key => installType[key]());
  } else {
    delete types[typeName];

    if (installType[typeName]) {
      installType[typeName]();
    }
  }
};

const resetRule = (ruleName?: string) => {
  if (!ruleName) {
    rules = {};
    Object.keys(installRule).forEach(key => installRule[key]());
  } else {
    delete rules[ruleName];

    if (installType[ruleName]) {
      installType[ruleName]();
    }
  }
};

const installType = {
  string: () => {
    ensureType<string>('string', {
      typeCheck: (value) => (typeof value === 'string'),
      minLength: (value, { minLength }) => (value.length >= minLength),
      maxLength: (value, { maxLength }) => (value.length <= maxLength),
    })
  },

  email: () => {
    ensureType<string>('email', {
      typeCheck: (value) => (
        typeof value === 'string'
        && !!(String(value)).match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
      )
    });
  },

  number: () => {
    ensureType<number>('number', {
      typeCheck: (value) => (
        typeof value === 'number' || !isNaN(parseFloat(value as any))
      ),
      min: (value, { min }) => (parseFloat(value as any) >= min),
      max: (value, { max }) => (parseFloat(value as any) <= max),
    });
  }
};

const installRule = {
  equal: () => {
    ensureRule('equal', (value, { equal }) => (value === equal));
  },

  match: () => {
    ensureRule('match', (value, { match }) => !!(String(value)).match(match));
  },

  required: () => {
    ensureRule('required', (value) => {
      if (value === undefined || value === null) {
        return false;
      }

      return !isNaN(value as any) && !!String(value);
    });
  }
};

const ensureRule = (ruleName: string, rule: SvelidationRule) => {
  if (typeof rule !== 'function') {
    console.warn('svelidation: ensureRule has to have second function argument', ruleName);
    return;
  }

  Object.assign(rules, {
    [ruleName]: rule
  });
};

const getType = (typeName: string): SvelidationType|undefined => types[typeName];
const getRule = (ruleName: string): SvelidationRule|undefined => rules[ruleName];

resetType();
resetRule();

export { ensureRule, ensureType, resetType, resetRule, SvelidationValue, SvelidationRule, SvelidationRulesStore, getType, getRule };