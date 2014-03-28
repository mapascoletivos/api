/**
 * Module dependencies.
 */

var 
	_ = require('underscore'),
	https = require('https'),
	passport = require('passport'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	AccessToken = mongoose.model('AccessToken');


var generateAccessToken = function(user, res) {

	var token = new AccessToken({user: user._id});

	token.save(function(err) {
		if (err) {
			console.log(err);
			return res.json(401, { messages: [ { status: 'error', text: 'Unauthorized' } ] } );
		}

		var response = _.extend({
			accessToken: token._id
		}, user.toObject());

		res.json(response);

	});

}

var authSocialUser = function(provider, profile, res) {

	var 
		userProfile = {};

	switch (provider) {
		case 'google':
			userProfile.email = profile.emails[0].value;
			userProfile.name = profile.displayName;
			userProfile.google = profile;
			break;
	} 

	User.load({email: userProfile.email}, function(err, user){
		if (err)
			return res.json(401, {messages: [{status: 'error', message: 'Aconteceu um erro ao gerar o token.'}]})
		if (!user) {

			user = new User(userProfile);
			user.save(function(err){
				if (err)
					return res.json({status: 'error', message: 'Erro gravando usuário.'})
				generateAccessToken(user, res);
			})
		} else {

			// add third party info if not present
			if ((provider == 'google') && (!user.google)) {
				user.google = profile;
			}

			if (user.isModified) {
				user.save(function(err){
					if (err) return res.json(err);
					generateAccessToken(user, res);	
				})
			} else generateAccessToken(user, res);	
		}  
	})
}

exports.google = function(req, res){
	return res.json({});
	// Google Access Token should be send via Authorization request header field 
	if (req.headers.authorization) {
		var authorizationField = req.headers.authorization.split(' ');
		if (authorizationField[0] = 'Bearer'){
			
			https.get('https://www.googleapis.com/plus/v1/people/me?access_token='+authorizationField[1], function(response) {
				var body = '';

				if (response.statusCode == 200) {
					response.on('data', function(d) {
						body += d;
					});

					response.on('end', function(){
						var profile = JSON.parse(body);
						authSocialUser('google', profile, res);
					});					
				} else {
					res.json(response.statusCode);
				}

			}).on('error', function(e) {
				res.json(e);
			});
		}
	} else {
		return res.json(req.headers.authorization.length);
	}
}

exports.local = function(req, res, next) {

	passport.authenticate('local', function(err, user, info) {

		if (err) { return next(err); }
		if (!user) { return res.json(401, { messages: [ { status: 'error', text: 'Unauthorized' } ] } ); }

		generateAccessToken(user, res);

	})(req, res, next);

};
