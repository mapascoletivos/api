var _ = require('underscore');

/**
 * Single error message.
 */

exports.error = function (text) {
  return { messages: [{ status: 'error', text: text }] };
};

/**
 * Single success message.
 */

exports.success = function (text) {
  return { messages: [{ status: 'ok', text: text }] };
};

/**
 * Mongoose error messages.
 */

exports.mongooseErrors = function (t, err, model) {
  var errors = err.errors || err;

  var messages = [];

  var keys = Object.keys(errors);

  // if there is no validation error, just display a generic error
  if (!keys) {
    return { messages: [{ status: 'error', text: t('Database error.') }] };
  } else {
    keys.forEach(function (key) {
      messages.push({
        status: 'error',
        text: t('mongoose.errors.' + model + '.' + errors[key].message)
      });
    });
    return { messages: messages };
  }
};

exports.errorsArray = function (i18n, array) {
  const messages = [];

  array.forEach(function (message) {
    messages.push({ status: 'error', text: i18n.t(message) });
  });

  return messages;
};

exports.errors = function (err) {
  var errors = err.errors || err;
  var json = {};

  json.messages = [];

  if (Array.isArray(errors)) {
    json.messages = errors.map(error => {
      return {
        status: 'error',
        text: error.message
      };
    });
  } else if (errors.name === 'MongoError') {
    json.messages.push({ status: 'error', text: errors.err });
  } else {
    var keys = Object.keys(errors);

    // if there is no validation error, just display a generic error
    if (!keys) {
      return { messages: [{ status: 'error', text: 'Houve um erro.' }] };
    }

    keys.forEach(function (key) {
      json.messages.push({ status: 'error', text: errors[key].err });
    });
  }

  return json;
};

