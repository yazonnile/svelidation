import prepareBaseParams from './prepare-base-params';
import {SvelidationPhase} from "../typing/typing";

describe('prepareBaseParams', () => {
  it('should work with any input', () => {
    let options = {
      validateOn: ['change'],
      clearOn: ['reset'],
      listenInputEvents: SvelidationPhase.afterValidation,
      presence: 'optional',
      trim: false
    };

    expect(prepareBaseParams({ a: 1 }, options)).toEqual({ a: 1 });
    options.presence = 'required';
    options.trim = true;
    expect(prepareBaseParams({ a: 1 }, options)).toEqual({ a: 1, required: true, trim: true });
    expect(prepareBaseParams({ a: 1, optional: true }, options)).toEqual({ a: 1, optional: true, trim: true });
    expect(prepareBaseParams({ a: true, trim: false }, options)).toEqual({ a: true, trim: false, required: true });
  });
});