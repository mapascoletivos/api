var 
	mongoose = require('mongoose'),
	LocalStrategy = require('passport-local').Strategy,
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
				if (err) 
					return done(err)
				else if (!user) 
					return done(null, false, { message: 'Usuário não cadastrado.' })
				else if (user.hashed_password && !user.authenticate(password))
          			return done(null, false, { message: 'Invalid password' })
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