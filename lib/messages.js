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

exports.errorsArray = function(array) {
	var json = {};
	json.messages = [];

	array.forEach(function (message) {
		json.messages.push({status: 'error', text: message });
	})

	return json;
}

exports.mongooseErrors = function(errors) {

	errors = errors.errors || errors;
	
	var keys = Object.keys(errors)
	var errs = []

	// if there is no validation error, just display a generic error
	if (!keys) {
		return ['Oops! There was an error']
	}

	keys.forEach(function (key) {
		errs.push({status: 'error', text: errors[key].message});
	})

	return errs
}

exports.error = function (error) {
	return {messages: [{ status: 'error', text: error }]}
}

exports.success = function (message) {
	return {messages: [{ status: 'success', text: message }]}
}
