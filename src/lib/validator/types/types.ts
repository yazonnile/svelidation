type SvelidationRule<Type = any, R = boolean> = {
  (value: Type, params?: {
    [key: string]: any
  }): R
}

type SvelidationType<Type = any> = {
  typeCheck?: SvelidationRule<Type>;
  [key: string]: SvelidationRule<Type>
}

type SvelidationTypesStore<Type = any> = {
  [key: string]: SvelidationType<Type>
}

type SvelidationRulesStore<Type = any> = {
  [key: string]: SvelidationRule<Type>
}

let types: SvelidationTypesStore | {} = {};
let rules: SvelidationRulesStore | {} = {};

const ensureType = <Type = any>(
  typeName: string,
  typeRules: SvelidationType<Type>
) => {
  if (typeof typeRules !== 'object') {
    console.warn('svelidation: rules should be an object', typeName);
    return;
  }

  Object.keys(typeRules).reduce((obj, key) => {
    const rule = typeRules[key];

    try {
      if (typeof rule === 'string') {
        const [ typeName, ruleName ] = (rule as string).split('.');
        const inheritedRule = getType(typeName)[ruleName];

        if (typeof inheritedRule === 'function') {
          obj[ruleName] = inheritedRule;
        }
      } else if (typeof rule === 'function') {
        obj[key] = rule;
      }
    } catch (e) {
      delete obj[key];
    }

    return obj;
  }, typeRules);

  if (!types[typeName]) {
    if (typeof typeRules.typeCheck !== 'function') {
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
        typeof value === 'number' || !isNaN(parseFloat(value))
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

      if (typeof value === 'number') {
        return !isNaN(value as any);
      }

      return !!String(value);
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

export { ensureRule, ensureType, resetType, resetRule, SvelidationRule, SvelidationRulesStore, getType, getRule };
