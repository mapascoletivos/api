

var _ = require('underscore');

/**
 * Single error message.
 */

exports.error = function (text) {
	return {messages: [{ status: 'error', text: text }]};
}

/**
 * Single success message.
 */

exports.success = function (text) {
	return {messages: [{ status: 'ok', text: text }]};
}

/**
 * Mongoose error messages.
 */

exports.mongooseErrors = function(t, err, model) {
	var 
		errors = err.errors || err,
		messages = [];

	var keys = Object.keys(errors)

	// if there is no validation error, just display a generic error
	if (!keys) {
		return {messages: [{ status: 'error', text: t('Database error.')}]};
	} else {
		keys.forEach(function (key) {
			messages.push({status: 'error', text: t('mongoose.errors.'+ model +'.'+errors[key].message) })
		});
		return {messages: messages};
	}
}


exports.errorsArray = function(i18n, array) {
	
	messages = [];

	array.forEach(function (message) {
		messages.push({status: 'error', text: i18n.t(message) });
	})

	return messages;
}



exports.errors = function (err) {

	var errors = err.errors || err;
	var json = {};

	json.messages = [];
	
	if (typeof(errors) == 'Array') {
		errors.forEach(function(error){
			json.messages.push({status: 'error', text: errors })
		})
	} else if (errors.name == 'MongoError') {
		json.messages.push({status: 'error', text: errors.err})
	} else {
		var keys = Object.keys(errors)

		// if there is no validation error, just display a generic error
		if (!keys) {
			return {messages: [{ status: 'error', text: 'Houve um erro.'}]}
		}

		keys.forEach(function (key) {
			json.messages.push({status: 'error', text: errors[key].err })
		})
	}

	return json;
}

/**
 * Helper function to check if a request body has Yby's API compliant messages.
 */

exports.hasValidMessages = function(body) {
	if (!body.messages) return false;
	if (body.messages.lenght == 0) return false;
	else {
		var invalidMessages = _.reject(body.messages, function(message){
			var statusIsValid = _.contains(['error', 'ok'], message.status); 
			var textIsValid = (message.text && message.text.length > 0);
			return (statusIsValid && textIsValid);
		});
		return (invalidMessages.length == 0);
	}
}