const config = require('config');
const i18n = require('i18next');

module.exports = (function () {
  const i18nConfig = Object.assign({}, config.get('i18n'));
  i18n.init(i18nConfig);
  return i18n;
})();
