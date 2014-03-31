var 
	mongoose = require('mongoose'),
	mailer = require('../app/mailer'),
	LocalStrategy = require('passport-local').Strategy,
	FacebookTokenStrategy = require('passport-facebook-token').Strategy,
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
							return done(null, false, { message: 'Você precisa de uma senha para acessar sua conta. Verifique seu e-mail para continuar.' });
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

	passport.use(new BearerStrategy({}, function(token, done) {
		AccessToken.load({'_id': token}, function(err, token) {
			if(err)
				return done(err);

			if(!token || !token.user)
				return done(null, false);

			return done(null, token.user);
		});
	}));

}