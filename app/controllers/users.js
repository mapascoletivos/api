
/**
 * Module dependencies.
 */

var 
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	mailer = require('../mailer'),
	validator = require('validator'),
	utils = require('../../lib/utils'),
	extend = require('util')._extend,
	_ = require('underscore');

var login = function (req, res) {
	var redirectTo = req.session.returnTo ? req.session.returnTo : '/dashboard';
	delete req.session.returnTo;
	res.redirect(redirectTo);
}

exports.signin = function (req, res) {}

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
	user.provider = 'local';

	// Avoid e-mail confirmation at development environment
	if (process.env.NODE_ENV == 'development') {
		user.needsEmailConfirmation = false;
	}


	user.save(function (err) {
		if (err) {
			// req.flash('error', utils.errorMessagesFlash(err.errors));
			return res.render('users/signup', {
				errors: utils.errorMessagesFlash(err.errors),
				user: user
			});
		}

		// Don't send email if user is active
		if (!user.needsEmailConfirmation) {
			return res.redirect('/login');
		} else {
			mailer.welcome(user, function(err){
				if (err) {
					req.flash('error', 'Erro ao enviar o e-mail de ativação.');
				}
				else {
					req.flash('info', 'Um link de ativação de usuário foi enviado para seu e-mail.');
				}
				return res.redirect('/login');
			});	
		}
		
		
	})
}

/**
 * Update user
 */

exports.update = function (req, res) {

	User.findById(req.user._id, function(err, user){
		
		// User is changing password
		if (req.body.userPwd) {
			if (!user.authenticate(req.body.userPwd)) {
				return res.json(400, { messages: [{status: 'error', text: 'Invalid password.'}] });
			} else {
				if (req.body.newPwd != req.body.validatePwd) 
					return res.json(400, { messages: [{status: 'error', text: "Passwords don't match." }] });
				else
					user.password = req.body.newPwd;
			}

		// User is changing e-mail
		} else if ((req.body.email) && (req.body.email != user.email)) {
			if (validator.isEmail(req.body.email)) {
				mailer.changeEmail(user, req.body.email, function(err){
					if (err) {
						console.log(err)
						return res.json(400, { messages: [{status: 'error', text: "Error while trying to changing email."}] });
					} else {
						return res.json({ messages: [{status: 'ok', text: 'An email was sent to confirm new e-mail address.'}] });
					}
				});
			} else {
				return res.json(400, { messages: [{status: 'error', text: "Endereço de e-mail inválido."}] });			
			}
		} else {
			user.bio = req.body.bio;
			user.name = req.body.name;
			user.username = req.body.username;
			user.email = req.body.email;
			user.save(function(err){
				if (err) res.json(400, utils.errorMessages(err.errors || err));
				else res.json({ messages: [{status: 'ok', text: 'User profile info updated successfully.'}] });
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
