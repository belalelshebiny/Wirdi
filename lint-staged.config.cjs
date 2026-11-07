const lintAndFormat = ['eslint --fix --cache --no-warn-ignored', 'prettier --write'];

module.exports = {
  '{apps,packages}/**/*.{ts,tsx,js,jsx}': lintAndFormat,
};
