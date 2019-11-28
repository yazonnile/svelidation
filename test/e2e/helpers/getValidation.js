import Validation from 'svelidation';

export default ({
  entries,
  options = {},
  validateOn
}) => {
  if (typeof validateOn !== 'undefined') {
    options.vaidateOn = validateOn;
  }

  const validation = new Validation(options);
  let { createForm, validateAll, clearErrors, validateStore, createEntry } = validation;

  validateAll = validateAll.bind(validation);
  clearErrors = clearErrors.bind(validation);
  validateStore = validateStore.bind(validation);
  createEntry = createEntry.bind(validation);

  return {
    entries: validation.createEntries(entries),
    createForm, validateAll, clearErrors, validateStore, createEntry
  }
}
