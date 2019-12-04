import { SvelidationValidatorParams } from 'lib/validator/validator';
import {
  SvelidationPresence,
  SvelidationEntryParams,
  SvelidationOptions
} from 'lib/typing/typing';

const prepareBaseParams = (entryParams: SvelidationEntryParams, validationOptions: SvelidationOptions): SvelidationValidatorParams => {
  const { trim: entryTrim, required, optional } = entryParams;
  const { presence, trim: optionsTrim } = validationOptions;
  const output = { ...entryParams };

  if (presence === SvelidationPresence.required && required === undefined && optional === undefined) {
    output.required = true;
  }

  if (optionsTrim && entryTrim === undefined) {
    output.trim = true;
  }

  return output;
};

export default prepareBaseParams;
