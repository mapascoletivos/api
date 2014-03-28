exports.errors = function (err) {

	var errors = err.errors || err;


	if (typeof(errors) == 'Array') {
		errors.forEach(function(error){
			json.messages.push({status: 'error', text: errors })
		})
	} else {
		var keys = Object.keys(errors)

		// if there is no validation error, just display a generic error
		if (!keys) {
			return {messages: [{ status: 'error', text: 'Houve um erro.'}]}
		}

		var json = {};
		json.messages = [];

		keys.forEach(function (key) {
			json.messages.push({status: 'error', text: errors[key].message })
		})
	}

	return json;
}


exports.error = function (error) {

	return {messages: [{ status: 'error', text: error }]}

}

exports.info = function (info) {

	return {messages: [{ status: 'info', text: info }]}

}
