
/*!
* Module dependencies.
*/

var   
	path = require('path'),
	rootPath = path.resolve(__dirname + '../..'),
	templatePath = path.normalize(__dirname + '/../app/mailer/templates'),
	app_url = process.env.APP_URL || ('http://localhost:' + (process.env.PORT || 3000)),
	nodemailer = {
		host: process.env.SMTP_HOST,
		port: 465,
		secureConnection: true,
		requiresAuth: true,
		auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASSWORD
		},
		from: process.env.SMTP_FROM
	},
	oauth = {
		facebook: {
			clientID: process.env.FACEBOOK_CLIENT_ID || 'APP_ID',
			clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'APP_SECRET',
			callbackURL: app_url + "/auth/facebook/callback"
		},
		google: {
			clientID: process.env.GOOGLE_CLIENT_ID || 'APP_ID',
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'APP_SECRET',
			callbackURL: app_url + "/auth/google/callback"
		}	
	}

/**
* Expose config
*/

module.exports = {
	development: {
		root: rootPath,
		appUrl: 'http://localhost:3000',
		nodemailer: nodemailer,
		db: 'mongodb://localhost/mapascoletivos_dev',
		oauth: oauth
	},
	test: {
		root: rootPath,
		appUrl: 'http://localhost:3000',
		db: 'mongodb://localhost/mapascoletivos_test',
		nodemailer: nodemailer,
		oauth: oauth
	},
	production: {
		root: rootPath,
		appUrl: app_url,
		db: 'mongodb://localhost/mapascoletivos_production',
		nodemailer: nodemailer,
		oauth: oauth
	}
}