const path = require('path');

module.exports = {
  plugins: {
    tailwindcss: {
      config: path.join(__dirname, 'apps/frontend/tailwind.config.js'),
    },
    autoprefixer: {},
  },
};
