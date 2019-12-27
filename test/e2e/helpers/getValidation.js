import createValidation from 'dist';

export default ({
  entries,
  options = {},
  validateOnEvents
}) => {
  if (typeof validateOnEvents !== 'undefined') {
    options.validateOnEvents = validateOnEvents;
  }

  const { createForm, validate, clearErrors, validateValueStore, createEntry, createEntries, getValues } = createValidation({
    presence: 'required', // set required for e2e testing
    ...options
  });

  return {
    entries: createEntries(entries),
    createForm, validate, clearErrors, validateValueStore, createEntry, getValues
  }
}
