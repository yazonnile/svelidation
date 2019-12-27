let enable = true;

export const disableWarn = () => {
  enable = false;
};

export default (...args) => {
  enable && console.warn(...args);
};
