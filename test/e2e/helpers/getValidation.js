import Validation from 'dist';

export default ({
  entries,
  options = {},
  validateOn
}) => {
  if (typeof validateOn !== 'undefined') {
    options.vaidateOn = validateOn;
  }

  const validation = new Validation(options);
  let { createForm, validate, clearErrors, validateStore, createEntry } = validation;

  validate = validate.bind(validation);
  clearErrors = clearErrors.bind(validation);
  validateStore = validateStore.bind(validation);
  createEntry = createEntry.bind(validation);

  return {
    entries: validation.createEntries(entries),
    createForm, validate, clearErrors, validateStore, createEntry
  }
}
