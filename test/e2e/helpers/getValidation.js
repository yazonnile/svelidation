import createValidation from 'dist';

export default ({
  entries,
  options = {},
  validateOnEvents
}) => {
  if (typeof validateOnEvents !== 'undefined') {
    options.validateOnEvents = validateOnEvents;
  }

  const { createForm, validate, clearErrors, validateValueStore, createEntry, createEntries } = createValidation(options);

  return {
    entries: createEntries(entries),
    createForm, validate, clearErrors, validateValueStore, createEntry
  }
}
