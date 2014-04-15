
/*!
* Module dependencies.
*/

var   
	path = require('path'),
	rootPath = path.resolve(__dirname + '../..'),
	app_url = process.env.APP_URL || ('http://localhost:' + (process.env.PORT || 3000))

/**
* Expose config
*/

module.exports = {
	development: {
		allowedDomains: '*',
		root: rootPath,
		db: 'mongodb://localhost/yby_dev'
	},
	test: {
		root: rootPath,
		db: 'mongodb://localhost/yby_test' 
	},
	production: {
		allowedDomains: '*', // temporary
		root: rootPath,
		db: process.env.MONGOLAB_URI || 'mongodb://localhost/yby_production'
	}
}