
/**
 * Single error message.
 */

exports.error = function (text) {
	return [{ status: 'error', text: text }];
}

/**
 * Single success message.
 */

exports.success = function (text) {
	return [{ status: 'ok', text: text }]
}

/**
 * Mongoose error messages.
 */

exports.mongooseErrors = function(i18n, err) {
	var 
		errors = err.errors || err,
		messages = [];

	var keys = Object.keys(errors)

	// if there is no validation error, just display a generic error
	if (!keys) {
		return [{ status: 'error', text: i18n.t('Database error.')}];
	} else {
		keys.forEach(function (key) {
			messages.push({status: 'error', text: i18n.t(errors[key].message) })
		});
		return messages;
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
