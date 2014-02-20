
/*!
* Module dependencies.
*/

var   
	path = require('path'),
	rootPath = path.resolve(__dirname + '../..'),
	templatePath = path.normalize(__dirname + '/../app/mailer/templates')
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
		appUrl: 'http://localhost:3000',
		db: 'mongodb://localhost/mapascoletivos_test',
		nodemailer: nodemailer,
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
		appUrl: 'http://mapascoletivos.herokuapp.com',
		db: process.env.MONGOHQ_URL || process.env.MONGOLAB_URI,
		nodemailer: nodemailer,
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