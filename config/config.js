/*!
 * Module dependencies.
 */

const path = require('path');

const rootPath = path.join(__dirname, '..');

const i18n = {
  lng: 'pt-BR',
  preload: ['pt-BR'],
  shorcutFunction: 'defaultValue',
  fallbackLng: 'en',
  saveMissing: true,
  debug: true
};

/**
 * Expose config
 */

module.exports = {
  development: {
    root: rootPath,
    db: process.env.MONGODB_URI || 'mongodb://localhost:27018/yby_dev',
    i18n: i18n
  },
  test: {
    root: rootPath,
    db: process.env.MONGODB_URI || 'mongodb://localhost:27019/yby_test',
    i18n: i18n
  },
  production: {
    root: rootPath,
    db: process.env.MONGODB_URI || 'mongodb://localhost:27018/yby_production',
    i18n: i18n
  }
};
