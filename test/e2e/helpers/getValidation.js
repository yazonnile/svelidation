import createValidation from 'dist';

export default ({
  entries,
  options = {},
  validateOn
}) => {
  if (typeof validateOn !== 'undefined') {
    options.vaidateOn = validateOn;
  }

  const { createForm, validate, clearErrors, validateStore, createEntry, createEntries } = createValidation(options);

  return {
    entries: createEntries(entries),
    createForm, validate, clearErrors, validateStore, createEntry
  }
}
