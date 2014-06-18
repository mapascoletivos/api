var 
	mongoose = require('mongoose'),
	LocalStrategy = require('passport-local').Strategy,
	BearerStrategy = require('passport-http-bearer').Strategy,
	User = mongoose.model('User'),
	AccessToken = mongoose.model('AccessToken');

module.exports = function (passport, config) {

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
			passwordField: 'password',
			passReqToCallback: true
		},
		function(req, email, password, done) {
			User.findOne({ email: email }, function (err, user) {
				if (err) 
					return done(err)
				else if (!user) 
					return done(null, false, { message: 'access_token.local.user_not_registered' })
				else if (user.status == 'to_migrate') {

					var data = {
						user: user,
						callbackUrl: req.app.locals.settings.general.clientUrl + '/login'
					}

					req.app.locals.mailer.sendEmail('password_reset', user.email, data, req.i18n, function(err) {
						console.log(err);
						if (err) 
		          			return done(err, false, { message: 'access_token.local.needs_migration.error' })
						else 
		          			return done(null, false, { message: 'access_token.local.needs_migration.sent' })
					});
				}
				else if (user.hashed_password && !user.authenticate(password))
          			return done(null, false, { message: 'access_token.local.invalid_password' })
				else 
					return done(null, user);
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