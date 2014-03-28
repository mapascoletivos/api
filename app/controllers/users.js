
/**
 * Module dependencies.
 */

var 
	mongoose = require('mongoose'),
	passport = require('passport'),
	User = mongoose.model('User'),
	AccessToken = mongoose.model('AccessToken'),
	Layer = mongoose.model('Layer'),
	Map = mongoose.model('Map'),
	mailer = require('../mailer'),
	validator = require('validator'),
	utils = require('../../lib/utils'),
	messages = require('../../lib/messages'),
	extend = require('util')._extend,
	_ = require('underscore');



var getAccessToken = function(user, res) {

	var token = new AccessToken({user: user});

	token.save(function(err) {
		if(err) {
			return res.json(401, { messages: [ { status: 'error', text: 'Unauthorized' } ] } );
		}

		var response = _.extend({
			accessToken: token._id
		}, user.toObject());

		res.json(response);

	});

}

exports.passportCallback = function(provider, req, res, next) {

	passport.authenticate(provider, function(err, user, info) {

		if (err) { return next(err); }
		if (!user) { return res.json(401, { messages: [ { status: 'error', text: 'Unauthorized' } ] } ); }

		getAccessToken(user, res);

	})(req, res, next);

};

exports.oauthAccessToken = function(req, res, next) {

	getAccessToken(req.user, res);

}



var login = function (req, res) {

}

/**
 * Find user by id
 */

exports.user = function (req, res, next, id) {
	var query = { username:id };
	if(id.match(/^[0-9a-fA-F]{24}$/)) // change query if id string matches object ID regex
		query = { _id: id };
	User
		.findOne(query)
		.exec(function (err, user) {
			if (err) return next(err)
			if (!user) return next(new Error('Failed to load User ' + id))
			req.profile = user
			next()
		});
}

exports.info = function(req, res, next) {
	return res.json(req.user.info());
}

exports.layers = function(req, res, next) {
	var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
	var perPage = (req.param('perPage') > 0 ? req.param('perPage') : 30);
	var options = {
		perPage: perPage,
		page: page,
		criteria: { $or: [ { creator: req.user }, {contributors: { $in: [req.user._id] } } ] }
	}

	if (req.param('search')) {
		options.criteria = {
			$and: [
				options.criteria,
				{ title: { $regex: req.param('search'), $options: 'i' }}
			]
		}
	}

	Layer.list(options, function(err, layers) {
		console.log(err);
		if (err) return res.json(400, err);
		Layer.count(options.criteria).exec(function (err, count) {
			if (!err) {
				res.json({options: options, layersTotal: count, layers: layers});
			} else {
				res.json(400, utils.errorMessages(err.errors || err))
			} 
		});
	});

}

exports.maps = function(req, res, next) {
	var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
	var perPage = (req.param('perPage') > 0 ? req.param('perPage') : 30);
	var options = {
		perPage: perPage,
		page: page,
		criteria: { creator: req.user }
	}

	if (req.param('search'))
		options.criteria = {
			$and: [
				options.criteria,
				{ title: { $regex: req.param('search'), $options: 'i' }}
			]
		}

	Map.list(options, function(err, maps) {
		if (err) return res.json(400, utils.errorMessages(err.errors || err));
		Map.count(options.criteria).exec(function (err, count) {
			if (err) res.json(400, utils.errorMessages(err.errors || err));
			else res.json({options: options, mapsTotal: count, maps: maps});
		})
	})
}

/**
 * Auth callback
 */

exports.authCallback = login;

/**
 * Show login form
 */

exports.login = function (req, res) {
	res.render('users/login', {
		title: 'Login',
		message: req.flash('error'),
		user: req.user ? JSON.stringify(req.user) : 'null'
	});
}

/**
 * Show forgot password form
 */

exports.forgotPassword = function (req, res) {
	res.render('users/forgot_password', {
		title: 'Recuperar senha',
		message: req.flash('error')
	});
}

/**
 * Send reset password token
 */

exports.newPasswordToken = function (req, res) {
	User.findOne({
		$or: [
		{email: req.body['emailOrUsername']}, 
		{username: req.body['emailOrUsername']}
		]
	}, function(err,user){
		if (err) 
			res.render('users/forgot_password', {
				title: 'Recuperar senha',
				message: req.flash('error')
			});
		else {
			if (user) {
				mailer.passwordReset(user, function(err){
					if (err) {
						req.flash('error', 'Houve um erro ao enviar e-mail para mudança de senha');
						return res.redirect('users/forgot_password');
					} else {
						req.flash('info', 'Um link de alteração de senha foi enviado para seu e-mail');
						return res.redirect('/login');
					}
				});
			} else {
				req.flash('error', 'Usuário não encontrado.');
				res.render('users/forgot_password', {
					title: 'Recuperar senha',
					message: req.flash('error')
				});				
			}
		}
	})
}


/**
 * Show sign up form
 */

exports.signup = function (req, res) {
	res.render('users/signup', {
		title: 'Sign up',
		user: new User()
	});
}

/**
 * Show migrate form
 */

exports.showMigrate = function (req, res) {
	res.render('users/migrate');
}

/**
 * Generate migration token
 */

exports.migrate = function (req, res) {
	var
		email = req.body.email,
		password = req.body.password,
		errors = [];

	if (!email) {
		errors.push('Informe um e-mail.');
	}

	if (!password) {
		errors.push('Informe uma nova senha');
	}

	if ((password) && (password.length < 6)) {
		errors.push('A nova senha deve ter ao menos 6 caracteres.');
	}

	if (errors.length > 0) {
		res.render('users/migrate', {
			errors: errors,
			email: email
		});
	} else {
		User.findOne({email: email, status: 'to_migrate'}, function(err, user){
			if (err) {
				res.render('users/migrate', {
					errors:  utils.errorMessagesFlash(err.errors),
					email: email
				});
			} else if (!user) {
				res.render('users/migrate', {
					errors:  ['Usuário não encontrado ou migração já realizada.'],
					email: email
				});
			} else {
				mailer.migrateAccount(user, password, function(err){
					res.render('users/migrate', {
						info:  ['Um link de confirmação de migração foi enviado ao seu e-mail.'],
						email: email
					});
				})
			}
		})
	}

}



/**
 * Logout
 */

exports.logout = function (req, res) {
	req.logout();
	res.redirect('/login');
}

/**
 * Session
 */

exports.session = login;

/**
 * Create user
 */

exports.create = function (req, res) {

	var user = new User(req.body);
	var preValidationErrors = [];

	// Checks existence of all fields before sending to mongoose

	if (!user.name)
		preValidationErrors.push('Informe um nome.');
	if (!user.email)
		preValidationErrors.push('Informe uma email.');
	if (!user.password)
		preValidationErrors.push('Informe uma senha.');

	// Avoid e-mail confirmation at development environment
	if (process.env.NODE_ENV == 'development') {
		user.needsEmailConfirmation = false;
	}



	if (preValidationErrors.length > 0){
		return res.json(messages.errors(preValidationErrors))
	} else {
		user.save(function (err) {
			
			if (err) return res.json(messages.errors(err));		

			// Don't send email if user is active
			if (!user.needsEmailConfirmation) {			
				return res.json(messages.info('Usuário criado com sucesso.'))
			} else {
				mailer.welcome(user, function(err){
					if (err) return res.json(messages.errors(err));
					res.json(messages.info('Usuário criado com sucesso. Um link de confirmação foi enviado para seu email.'));
				});	
			}
		})		
	}
}

/**
 * Update user
 */

exports.update = function (req, res) {

	User.findById(req.user._id, function(err, user){
		

		// User is changing password
		if (req.body.userPwd) {
			if (!user.authenticate(req.body.userPwd)) {
				return res.json(400, { messages: [{status: 'error', text: 'Senha atual inválida.'}] });
			} else if (req.body.newPwd.length < 6) {
				return res.json(400, { messages: [{status: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres.'}] });
			} else {
				if (req.body.newPwd == req.body.validatePwd){
					user.password = req.body.newPwd;
					user.save(function(err){
						if (err) res.json(400, utils.errorMessages(err.errors || err));
						else res.json({ messages: [{status: 'ok', text: 'Senha alterada com sucesso.'}] });
					});		
				} else {
					return res.json(400, { messages: [{status: 'error', text: "As senhas não coincidem." }] });
				}
			}
 
		// User is changing e-mail
		} else if (req.body.email) {

			// Check if is a diffent e-mail
			if (req.body.email == user.email) {
				return res.json(400, { 
					messages: [{status: 'error', text: 'Este já é o e-mail associado com seu perfil.'}]
				});
			}

			// Check if is valid
			if (!validator.isEmail(req.body.email)) {
				return res.json(400, { 
					messages: [{status: 'error', text: 'E-mail inválido.'}]
				});
			}

			// Send confirmation, if e-mail is not already used
			User.findOne({email: req.body.email}, function(err, anotherUser){
				if (!anotherUser) {
					mailer.changeEmail(user, req.body.email, function(err){
						if (err) {
							console.log(err)
							return res.json(400, { messages: [{status: 'error', text: "Erro ao enviar e-mail de alteração de endereço."}] });
						} else {
							return res.json({ messages: [{status: 'ok', text: 'Um e-mail foi enviado para confirmação do novo endereço.'}] });
						}
					});
				} else {
					return res.json(400, { messages: [{status: 'error', text: "Este endereço de e-mail já está cadastrado."}] });			
				}
			})
			


		} else {
			user.bio = req.body.bio;
			user.name = req.body.name;
			user.username = req.body.username;
			user.save(function(err){
				if (err) res.json(400, utils.errorMessages(err.errors || err));
				else res.json({ messages: [{status: 'ok', text: 'Perfil do usuário atualizado com sucesso.'}] });
			});		 
		}

	});
}

/**
 *	Show a user profile
 */

exports.show = function (req, res) {
	res.json(req.profile);
}
