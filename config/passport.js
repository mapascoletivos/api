var 
	mongoose = require('mongoose'),
	mailer = require('../app/mailer'),
	LocalStrategy = require('passport-local').Strategy,
	TwitterStrategy = require('passport-twitter').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	User = mongoose.model('User');


module.exports = function (passport, config) {
	// require('./initializer')

	// serialize sessions
	passport.serializeUser(function(user, done) {
		done(null, user.id)
	})

	passport.deserializeUser(function(id, done) {
		User.findOne({ _id: id }, function (err, user) {
			done(err, user)
		})
	})

	// use local strategy
	passport.use(new LocalStrategy({
			usernameField: 'email',
			passwordField: 'password'
		},
		function(email, password, done) {
			User.findOne({ email: email }, function (err, user) {
				if (err) { 
					return done(err) 
				}
				if (!user) {
					return done(null, false, { message: 'Unknown user' })
				}
				if (!user.authenticate(password)) {
					return done(null, false, { message: 'Invalid password' })
				}
				
				if (user.status == 'inactive') {
					mailer.welcome(user, function(err){
						if (err)
							return done(null, false, { message: 'Fail to send new activation email, please contact support' });
						else
							return done(null, false, { message: 'User is not active, new activation email sent.' });
					});
				} else if (user.status == 'need_password_update') {
					mailer.passwordUpdate(user, function(err){
						if (err)
							return done(null, false, { message: 'Failed to send email for password update, please contact support' });
						else
							return done(null, false, { message: 'This account needs a new password, please check you email.' });
					});
				} 
				else
					return done(null, user)
			})
		}
	))

	// use twitter strategy
	passport.use(new TwitterStrategy({
			consumerKey: config.twitter.clientID,
			consumerSecret: config.twitter.clientSecret,
			callbackURL: config.twitter.callbackURL
		},
		function(token, tokenSecret, profile, done) {
			User.findOne({ 'twitter.id_str': profile.id }, function (err, user) {
				if (err) { return done(err) }
				if (!user) {
					user = new User({
						name: profile.displayName,
						username: profile.username,
						provider: 'twitter',
						twitter: profile._json,
						status: 'active'
					})
					user.save(function (err) {
						if (err) console.log(err)
						return done(err, user)
					})
				}
				else {
					return done(err, user)
				}
			})
		}
	))

	// use facebook strategy
	passport.use(new FacebookStrategy({
			clientID: config.facebook.clientID,
			clientSecret: config.facebook.clientSecret,
			callbackURL: config.facebook.callbackURL
		},
		function(accessToken, refreshToken, profile, done) {
			User.findOne({ 'facebook.id': profile.id }, function (err, user) {
				if (err) { return done(err) }
				if (!user) {
					user = new User({
						name: profile.displayName,
						email: profile.emails[0].value,
						username: profile.username,
						provider: 'facebook',
						facebook: profile._json
					})
					user.save(function (err) {
						if (err) console.log(err)
						return done(err, user)
					})
				}
				else {
					return done(err, user)
				}
			})
		}
	))

	// use google login strategy
	passport.use(new GoogleStrategy({
			clientID: config.google.clientID,
			clientSecret: config.google.clientSecret,
			callbackURL: config.google.callbackURL
		},
		function(accessToken, refreshToken, profile, done) {
			User.findOne({ 'google.id': profile.id }, function (err, user) {
				if (!user) {
					user = new User({
						name: profile.displayName,
						email: profile.emails[0].value,
						username: profile.username,
						provider: 'google',
						google: profile._json
					})
					user.save(function (err) {
						if (err) console.log(err)
						return done(err, user)
					})
				} else {
					return done(err, user)
				}
			})
		}
	));

}