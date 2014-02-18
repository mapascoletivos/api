
/*!
* Module dependencies.
*/

var   
	path = require('path'),
	rootPath = path.resolve(__dirname + '../..'),
	templatePath = path.normalize(__dirname + '/../app/mailer/templates')
	notifier = {
		service: 'postmark', 
		email: true,
		actions: ['token', 'token'],
		tplPath: require('path').normalize(__dirname + '/app/mailer/templates'),
		key: process.env.POSTMARK_KEY
	} 

/**
* Expose config
*/

module.exports = {
	development: {
		root: rootPath,
		notifier: notifier,
		db: 'mongodb://localhost/mapascoletivos_dev',
		facebook: {
			clientID: "APP_ID",
			clientSecret: "APP_SECRET",
			callbackURL: "http://localhost:3000/auth/facebook/callback"
		},
		twitter: {
			clientID: "CONSUMER_KEY",
			clientSecret: "CONSUMER_SECRET",
			callbackURL: "http://localhost:3000/auth/twitter/callback"
		},
		google: {
			clientID: "APP_ID",
			clientSecret: "APP_SECRET",
			callbackURL: "http://localhost:3000/auth/google/callback"
		}
	},
	test: {
		root: rootPath,
		db: 'mongodb://localhost/mapascoletivos_test',
		notifier: notifier,
		facebook: {
			clientID: "APP_ID",
			clientSecret: "APP_SECRET",
			callbackURL: "http://localhost:3000/auth/facebook/callback"
		},
		twitter: {
			clientID: "CONSUMER_KEY",
			clientSecret: "CONSUMER_SECRET",
			callbackURL: "http://localhost:3000/auth/twitter/callback"
		},
		google: {
			clientID: "APP_ID",
			clientSecret: "APP_SECRET",
			callbackURL: "http://localhost:3000/auth/google/callback"
		}
	},
	staging: {
		root: rootPath,
		db: process.env.MONGOHQ_URL
	},
	production: {
		root: rootPath,
		db: process.env.MONGOHQ_URL || process.env.MONGOLAB_URI,
		notifier: notifier,
		facebook: {
			clientID: process.env.FACEBOOK_CLIENT_ID,
			clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
			callbackURL: "http://mapascoletivos.herokuapp.com/auth/facebook/callback"
		},
		twitter: {
			clientID: process.env.TWITTER_CLIENT_ID,
			clientSecret: process.env.TWITTER_CLIENT_SECRET,
			callbackURL: "http://mapascoletivos.herokuapp.com/auth/twitter/callback"
		},
		google: {
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: "http://mapascoletivos.herokuapp.com/auth/google/callback"
		}
	}
}