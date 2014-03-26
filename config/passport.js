var 
	mongoose = require('mongoose'),
	mailer = require('../app/mailer'),
	LocalStrategy = require('passport-local').Strategy,
	TwitterStrategy = require('passport-twitter').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	BearerStrategy = require('passport-http-bearer').Strategy,
	User = mongoose.model('User'),
	AccessToken = mongoose.model('AccessToken');

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
					return done(null, false, { message: 'Usuário não cadastrado.' })
				}

				// User don't have a password yet
				if (user.status == 'to_migrate') {
					return done(null, false, { message: "Sua conta não foi migrada ainda. Visite esta <a href='/migrate' target='_self'>página</a>." });
				} else if (!user.hashed_password) {
					mailer.passwordNeeded(user, function(err){
						console.log(err);
						if (err)
							return done(null, false, { message: 'Você precisa de uma senha para acessar sua conta, mas houve um erro. Por favor, contate o suporte.' });
						else
							return done(null, false, { message: 'Você precisa de uma senha para acessar sua conta com o seu e-mail. Verifique seu e-mail para continuar.' });
					});				
				} else if (user.needsEmailConfirmation) {
					mailer.welcome(user, function(err){
						if (err)
							return done(null, false, { message: 'Erro ao enviar e-mail de ativação, por favor, contate o suporte.' });
						else
							return done(null, false, { message: 'Um e-mail de ativação foi enviado para sua caixa de correio.' });
					});
				} else if (!user.authenticate(password)) {
					return done(null, false, { message: 'Invalid password' })
				} else {
					return done(null, user);
				}
			})
		}
	))

	// use facebook strategy
	passport.use(new FacebookStrategy({
			clientID: config.oauth.facebook.clientID,
			clientSecret: config.oauth.facebook.clientSecret,
			callbackURL: config.oauth.facebook.callbackURL
		},
		function(accessToken, refreshToken, profile, done) {
			User.findOne({ 'facebook.id': profile.id }, function (err, user) {
				if (err) { return done(err) }

				// Not yet registered via Facebook
				if (!user) {

					// Check user registration via email
					User.findOne({ email: profile.emails[0].value }, function (err, user) {
						if (err) { return done(err) }


						// User have to migrate first
						if (user.status == 'to_migrate') {
							return done(null, false, { message: "Sua conta não foi migrada ainda. Visite esta <a href='/migrate' target='_self'>página</a>." });
						}							

						// User not registered, create one
						if (!user) {
							user = new User({
								name: profile.displayName,
								email: profile.emails[0].value,
								provider: 'facebook',
								facebook: profile._json,
								status: 'active',
								needsEmailConfirmation: false
							})
							
						// User is already registed by email, add Facebook info
						} else {
							user.facebook = profile._json;
						}

						// Save and return
						user.save(function (err) {
							if (err) console.log(err)
							return done(err, user)
						});
					});
				}
				else {
					return done(err, user)
				}
			})
		}
	))

	// use google login strategy
	passport.use(new GoogleStrategy({
			clientID: config.oauth.google.clientID,
			clientSecret: config.oauth.google.clientSecret,
			callbackURL: config.oauth.google.callbackURL
		},
		function(accessToken, refreshToken, profile, done) {
			User.findOne({ 'google.id': profile.id }, function (err, user) {
				if (err) { return done(err) }
				
				// Not yet registered via Google
				if (!user) {

					// Check user registration via email
					User.findOne({ email: profile.emails[0].value }, function (err, user) {
						if (err) { return done(err) }

						// User have to migrate first
						if (user.status == 'to_migrate') {
							return done(null, false, { message: "Sua conta não foi migrada ainda. Visite esta <a href='/migrate' target='_self'>página</a>." });
						}

						// User not registered, create one
						if (!user) {				
							user = new User({
								name: profile.displayName,
								email: profile.emails[0].value,
								provider: 'google',
								google: profile._json,
								status: 'active',
								needsEmailConfirmation: false
							})

						// User is already registed by email, add Google info	
						} else {
							user.google = profile._json
						}

						user.save(function (err) {
							if (err) console.log(err)
							return done(err, user)
						});
					});
				} else {
					return done(err, user)
				}
			})
		}
	));

	passport.use(new BearerStrategy({}, function(token, done) {
		AccessToken.load({'_id': token}, function(err, token) {
			if(err)
				return done(err);

			console.log(token);

			if(!token || !token.user)
				return done(null, false);

			return done(null, token.user);
		});
	}));

}