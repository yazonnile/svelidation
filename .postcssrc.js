const path = require('path');

module.exports = {
  plugins: {
    'postcss-url': {
      url: 'inline'
    },
    'postcss-custom-properties': {
      preserve: false,
      importFrom: path.resolve(__dirname, 'src/docs/variables.css')
    }
  }
};
