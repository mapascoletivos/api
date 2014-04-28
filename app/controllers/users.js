
/**
 * Module dependencies.
 */

var 
	_ = require('underscore'),
	validator = require('validator'),
	messages = require('../../lib/messages'),
	mailer = require('../../lib/mailer'),
	mongoose = require('mongoose'),
	passport = require('passport'),
	User = mongoose.model('User'),
	AccessToken = mongoose.model('AccessToken'),
	Layer = mongoose.model('Layer'),
	Map = mongoose.model('Map');


/**
 * Find user by id
 */

exports.user = function (req, res, next, id) {
	var query = { username:id };
	if(id.match(/^[0-9a-fA-F]{24}$/)) // change query if id string matches object ID regex
		query = { _id: id };
	User
		.load(query, function (err, user) {
			if (err) return next(err)
			if (!user) return next(new Error('Failed to load User ' + id))
			req.profile = user
			next()
		});
}

/**
 * Create user
 */

exports.create = function (req, res) {

	var user = new User(req.body);
	var preValidationErrors = [];

	// Checks existence of all fields before sending to mongoose

	if (!user.name)
		preValidationErrors.push('Please enter your name.');
	if (!user.email)
		preValidationErrors.push('Please enter your e-mail address.');
	else 
		if (!validator.isEmail(user.email))
			preValidationErrors.push('Invalid e-mail address.');
	

	if (!user.password)
		preValidationErrors.push('Please type a password.');
	else if (user.password.length < 6)
		preValidationErrors.push('Password should have at least 6 characters.');

	// Avoid e-mail confirmation at development environment
	// if (process.env.NODE_ENV == 'development') {
	// 	user.needsEmailConfirmation = false;
	// }

	if (preValidationErrors.length > 0){
		return res.json(400, { messages: messages.errorsArray(req.i18n, preValidationErrors) });
	} else {
		user.save(function (err) {
			if (err) return res.json(400, { messages: messages.mongooseErrors(req.i18n, err)});		

			// Don't send email if user is active
			if (!user.needsEmailConfirmation) {			
				return res.json(messages.success(req.i18n.t('User profile created successfully.')))
			} else {
				mailer.confirmEmail({
					mailSender: req.app.mailer, 
					user: user,
					callbackUrl: req.body.callback_url
				}, function(err){
					console.log(err);
					if (err) 
						return res.json({ messages: messages.mongooseErrors(req.i18n, err)});
					else 
						return res.json(messages.success(req.i18n('User profile created successfully. An activation link was sent.')));
				})
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
				return res.json(400, messages.error('Senha atual inválida.'));
			} else if (req.body.newPwd.length < 6) {
				return res.json(400, messages.error('A nova senha deve ter no mínimo 6 caracteres.'));
			} else {
				if (req.body.newPwd == req.body.validatePwd){
					user.password = req.body.newPwd;
					user.save(function(err){
						if (err) res.json(400, messages.errors(err));
						else res.json(messages.success('Senha alterada com sucesso.'));
					});		
				} else {
					return res.json(400, messages.error("As senhas não coincidem."));
				}
			}
 
		// User is changing e-mail
		} else if (req.body.email) {

			// Check if is a diffent e-mail
			if (req.body.email == user.email) {
				return res.json(400, messages.error('Este já é o e-mail associado com seu perfil.'));
			}

			// Check if is valid
			if (!validator.isEmail(req.body.email)) {
				return res.json(400, messages.error('E-mail inválido.'));
			}

			// Send confirmation, if e-mail is not already used
			User.findOne({email: req.body.email}, function(err, anotherUser){
				if (!req.body.callback_url){
					return res.json(400, messages.error("Invalid request (missing callback URL)."));			
				} else if (!anotherUser) {
					mailer.changeEmail(user, req.body.email, req.body.callback_url, function(err){
						if (err) {
							return res.json(400, messages.error("Erro ao enviar e-mail de alteração de endereço."));
						} else {
							return res.json(messages.success('Um e-mail foi enviado para confirmação do novo endereço.'));
						}
					});
				} else {
					return res.json(400, messages.error("Este endereço de e-mail já está cadastrado."));			
				}
			})
			


		} else {
			user.bio = req.body.bio;
			user.name = req.body.name;
			user.username = req.body.username;
			user.save(function(err){
				if (err) res.json(400, messages.errors(err));
				else res.json(messages.success('Perfil do usuário atualizado com sucesso.'));
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
 * Send reset password token
 */

exports.resetPasswordToken = function (req, res) {
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
				mailer.passwordReset({
					mailSender: req.app.mailer,
					user: user,
					callbackUrl: req.body.callback_url
				}, function(err){
					if (err) 
						return res.json(messages.errors(err));
					else 
						return res.json(messages.success('Um link de alteração de senha foi enviado para seu e-mail.'));
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

