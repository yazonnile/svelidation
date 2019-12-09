const getWithFirstUpper = (s) => s[0].toUpperCase() + s.slice(1);

export const getEntryHTML = (id, { type }) => {
  const typeClass = getWithFirstUpper(type);
  switch (true) {
    case type === 'boolean':
      return `<label><input bind:checked={$value${typeClass}${id}} use:input${typeClass}${id} class="input-choice" type="checkbox" /> Are you agree?</label>`;
    case type === 'array':
      return `<label><input bind:group={$value${typeClass}${id}} use:input${typeClass}${id} class="input-choice" type="checkbox" value="Lorem" /> Lorem</label>
<label><input bind:group={$value${typeClass}${id}} use:input${typeClass}${id} class="input-choice" type="checkbox" value="ipsum" /> Ipsum</label>
<label><input bind:group={$value${typeClass}${id}} use:input${typeClass}${id} class="input-choice" type="checkbox" value="dolor" /> Dolor?</label>`;
    case type === 'email':
      return `<input type="email" bind:value={$value${typeClass}${id}} use:input${typeClass}${id} class="input-text" />`;
    case type === 'number':
      return `<input type="number" bind:value={$value${typeClass}${id}} use:input${typeClass}${id} class="input-text" />`;
    default:
      return `<input type="text" bind:value={$value${typeClass}${id}} use:input${typeClass}${id} class="input-text" />`;
  }
};

export const getEntryErrors = (id, { type }) => {
  const typeClass = getWithFirstUpper(type);
  return `{#each $errors${typeClass}${id} as errorCode}
  <p>{errorCode} rule validation error</p>
{/each}`
};

export const getEntryJS = (id, params) => {
  const { type, ...rest } = params;
  const typeClass = getWithFirstUpper(type);
  let paramsObject = `type: ${type}`;
  Object.keys(rest).forEach(ruleKey => {
    const paramValue = ruleKey === 'match' ? `/${rest[ruleKey]}/` : (rest[ruleKey] === '' ? "''" : JSON.stringify(rest[ruleKey]));
    paramsObject += `\n  ${ruleKey}: ${paramValue}`;
  });

  return `<script>
const [ errors${typeClass}${id}, value${typeClass}${id}, input${typeClass}${id} ] = createEntry({
  ${paramsObject}
);
</scr`+`ipt>`;
};


export const getFormCode = ({ validateOnEvents, clearErrorsOnEvents, listenInputEvents, presence, trim, includeAllEntries }) => {
  const options = [];

  if (listenInputEvents !== 0 && (!validateOnEvents.change || validateOnEvents.input || validateOnEvents.blur)) {
    let code = '';
    code += `validateOnEvents: { `;
    if (validateOnEvents.change) code += `change: true, `;
    if (validateOnEvents.input) code += `input: true, `;
    if (validateOnEvents.blur) code += `blur: true, `;
    code += `}`;
    options.push(code);
  }

  if (!clearErrorsOnEvents.reset || (listenInputEvents !== 0 && clearErrorsOnEvents.focus)) {
    let code = '';
    code += `clearErrorsOnEvents: { `;
    if (clearErrorsOnEvents.reset) code += `reset: true, `;
    if (clearErrorsOnEvents.focus && listenInputEvents !== 0) code += `focus: true, `;
    code += `}`;
    options.push(code);
  }

  if (listenInputEvents !== 2) {
    options.push(`listenInputEvents: ` + listenInputEvents);
  }

  if (presence === 'required') {
    options.push(`presence: 'required'`);
  } else if (presence === 'optional') {
    options.push(`presence: 'optional'`);
  }

  if (trim) {
    options.push(`trim: true`);
  }

  if (includeAllEntries) {
    options.push(`includeAllEntries: true`);
  }

  const js = [
    `<script>`,
    `  import createSvelidation from 'svelidation';`,
    `  const { createEntry, createForm } = createSvelidation(${options.length ? `{\n    ${options.join(',\n    ')  }\n  }` : ''});`,
    `</script>`
  ].join('\n');

  const html = [
  `<form use:createForm novalidate on:submit|preventDefault>`,
  `  <!-- inputs -->`,
  `</form>`
  ].join('\n');

  return js + '\n\n' + html;
};
