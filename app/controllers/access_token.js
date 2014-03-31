/**
 * Module dependencies.
 */

var 
	_ = require('underscore'),
	crypto = require('crypto'),
	messages = require('../../lib/messages'),
	https = require('https'),
	passport = require('passport'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	AccessToken = mongoose.model('AccessToken');


var generateAccessToken = function(user, res) {

	var token = new AccessToken({user: user._id});

	var seed = crypto.randomBytes(20);
	token._id = crypto.createHash('sha1').update(seed).digest('hex');

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
		case 'facebook':
			userProfile.email = profile.email;
			userProfile.name = profile.name;
			userProfile.facebook = profile;
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
		return res.json(400, messages.error('Missing Google authorization token.'));
	}
}

exports.facebook = function(req, res, next) {

	if (req.headers.authorization) {
		var authorizationField = req.headers.authorization.split(' ');
		if (authorizationField[0] = 'Bearer'){
			
			console.log('vai buscar no facebook')

			https.get('https://graph.facebook.com/me?access_token='+authorizationField[1], function(response) {
				var body = '';

				if (response.statusCode == 200) {
					response.on('data', function(d) {
						body += d;
					});

					response.on('end', function(){
						var profile = JSON.parse(body);
						authSocialUser('facebook', profile, res);
					});					
				} else {
					res.json(response.statusCode);
				}

			}).on('error', function(e) {
				res.json(e);
			});
		}
	} else {
		return res.json(400, messages.error('Missing Facebook authorization token.'));
	}


};

exports.local = function(req, res, next) {

	passport.authenticate('local', function(err, user, info) {
		console.log(info);
		if (err) { return res.json(400, messages.errors(err)) }
		else if (info.message) { res.json(400, messages.error(info.message)) }
		else if (!user) { return res.json(403, messages.error("Unauthorized.")); }
		else generateAccessToken(user, res);

	})(req, res, next);

};

exports.logout = function(req, res, next) {

	req.logout;

	if (req.headers.authorization) {
		var access_token = req.headers.authorization.split(' ')[1];
		AccessToken.findOne({_id: access_token}, function(err, at){
			if (err) return res.json(400, err);
			if (!at) return res.json(400, messages.error("Can't find access token."));

			at.expired = true;
			at.save(function(err){
				if (err) return res.json(400, err);
				else return res.json(messages.success('Logout successfull.'));
			});
		});
	} else {
		res.json(400, messages.error('You are not logged in.'));
	}


};