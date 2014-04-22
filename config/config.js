
/*!
* Module dependencies.
*/

var   
	path = require('path'),
	rootPath = path.resolve(__dirname + '../..'),
	app_url = process.env.APP_URL || ('http://localhost:' + (process.env.PORT || 3000)),
	i18n = {
		// ns: { namespaces: ['ns.common', 'ns.special'], defaultNs: 'ns.special'},
		// resSetPath: 'locales/__lng__/new.__ns__.json',
		// saveMissing: true,
		// debug: true,
		// sendMissingTo: 'fallback'

		lng: 'pt-BR',
		preload: ['pt-BR'],
		fallbackLng: 'en',
		saveMissing: true,
		debug: true
	}


/**
* Expose config
*/

module.exports = {
	development: {
		allowedDomains: '*',
		root: rootPath,
		db: 'mongodb://localhost/yby_dev',
		i18n: i18n
	},
	test: {
		root: rootPath,
		db: 'mongodb://localhost/yby_test',
		i18n: i18n
	},
	production: {
		allowedDomains: '*', // temporary
		root: rootPath,
		db: process.env.MONGOLAB_URI || 'mongodb://localhost/yby_production',
		i18n: i18n
	}
}