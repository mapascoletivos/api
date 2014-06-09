
/**
 * Module dependencies.
 */

var 
	_ = require('underscore'),
	mongoose = require('mongoose'), 
	Token = mongoose.model('Token'),
	User = mongoose.model('User');
	
/**
 * Load
 */

exports.load = function(req, res, next, id){
	Token.findById(id, function (err, token) {
		if (err) return next(err);
		if (!token){
			return res.render('tokens/index', {
				errors: [req.i18n.t('token.load.error.not_found')], 
				autoRedirect: false 
			});	
		} 
		if (token.expiresAt < Date.now()) {
			return res.render('tokens/index', {
				errors: [req.i18n.t('token.load.error.expired')], 
				callbackUrl: token.callbackUrl,
				autoRedirect: false 
			});	
		}
		req.token = token;
		next()
	})
}

/**
 * Confirm E-mail Token
 */

exports.confirmEmail = function(req, res){
	var
		token = req.token;
		
	// invalid route for token
	if (token.type != 'confirm_email') {
		return res.render('tokens/index', {errors: [req.i18n.t('token.error.invalid_type')]});	
	} else {
		mongoose.model('User').findById(token.user, function(err, user){
			if (err) {
				return res.render('tokens/index', {
					errors: [req.i18n.t('token.confirm_email.error.user')],
					callbackUrl: token.callbackUrl,					
					autoRedirect: false
				});
			}
			
			user.emailConfirmed = true;

			user.save(function(err){
				if (err)
					return res.render('tokens/index', {
						errors: [req.i18n.t('token.confirm_email.error.user')],
						callbackUrl: token.callbackUrl,
						autoRedirect: false
					});
				else {

					token.expired = true;
					token.save(function(err){
						if (err)
							return res.render('tokens/index', {
								errors: [req.i18n.t('token.confirm_email.error.saving')],
								callbackUrl: token.callbackUrl,
								autoRedirect: false
							})
						else
							return res.render('tokens/index', {
								success: [req.i18n.t('token.confirm_email.success')],
								callbackUrl: token.callbackUrl,
								autoRedirect: true
							});
					});
				}
			});
		})
	}
}


/**
 * Accept Invitation
 */

exports.acceptInvitationForm = function(req, res){
	var
		token = req.token;
		
	// invalid route for token
	if (token.type != 'acceptInvitation') {
		return res.render('tokens/index', {errors: [req.i18n.t('token.accept_invitation.error.invalid_token')]});
	} else {
		return res.render('tokens/accept_invitation', {
			token: token
		});
	}

	
}

exports.acceptInvitation = function(req, res){
	var
		token = req.token;
		
	// invalid route for token
	if (token.type != 'acceptInvitation') {
		return res.render('tokens/index', {errors: [req.i18n.t('token.error.invalid')]});	
	} else {
		mongoose.model('User').findOne({email: token.data.user.email}, function(err, user){
			if (err) {
				return res.render('tokens/index', {
					errors: [req.i18n.t('token.accept_invitation.error.user_activation')],
					callbackUrl: token.callbackUrl,
					autoRedirect: false
				});
			}
			
			if (!user) {
				user = new User(token.data.user);
			}
			
			user.password = req.body.password;
			user.needsEmailConfirmation = false;

			user.save(function(err){
				if (err) {
					return res.render('tokens/index', {
						errors: [req.i18n.t('token.accept_invitation.error.user_activation')],
						callbackUrl: token.callbackUrl,
						autoRedirect: false
					});
				}
				else {

					token.expired = true;
					token.save(function(err){
						if (err)
							return res.render('tokens/index', {
								errors: [req.i18n.t('token.error.cant_save')],
								callbackUrl: token.callbackUrl,
								autoRedirect: false
							})
						else
							return res.render('tokens/index', {
								success: [req.i18n.t('token.accept_invitation.success')],
								callbackUrl: token.callbackUrl,
								autoRedirect: true
							});
					});
				}
			});
		})
	}
}



/**
 * New password form
 */

exports.newPasswordForm = function(req, res){
	var
		token = req.token;

	// invalid route for token
	if ((token.type != 'password_reset') && (token.type != 'password_needed')) {
		return res.render('tokens/index', {errors: [req.i18n.t('token.error.invalid')]});
	} else {
		res.render('users/new_password', {user: req.user, token: token})
	}
}

/**
 * Set new password
 */

exports.newPassword = function(req, res){
	var
		token = req.token;
	
	// invalid route for token
	if ((token.type != 'password_reset') && (token.type != 'password_needed')) {
		return res.render('tokens/index', {errors: [req.i18n.t('token.error.invalid')]});
	} else {
		mongoose.model('User').findById(token.user, function(err, user){
			if (err) {
				return res.render('tokens/index', {errors: [req.i18n.t('token.new_password.error.generic')]});
			}
			
			user.password = req.body.password;

			user.save(function(err){
				if (err)
					return res.render('tokens/index', {errors: [req.i18n.t('token.new_password.error.generic')]});
				else {
					return res.render('tokens/index', {
						info: [req.i18n.t('token.new_password.success')],
						callbackUrl: token.callbackUrl,
						autoRedirect: true
					});
				}
			});
		})
		
	}
}

/**
 * Migrate account
 */

exports.migrateAccount = function(req, res){
	var
		token = req.token;
	
	// invalid route for token
	if (token.type != 'migrate_account') {
		return res.render('tokens/index', {errors: [req.i18n.t('token.error.invalid')]});
	} else {
		mongoose.model('User').findById(token.user, function(err, user){
			if (err) {
				return res.render('tokens/index', {errors: [req.i18n.t('token.migration.error.generic')]});
			}
			
			user.password = token.data.password;
			user.status = 'active';
			user.needsEmailConfirmation = false;

			user.save(function(err){
				if (err)
				return res.render('tokens/index', {errors: [req.i18n.t('token.migration.error.generic')]});
				else {
					req.flash('info', req.i18n.t('token.migration.success'))
				}

				return res.redirect('/login');
			});
		})
		
	}
}

/**
 * Change e-mail
 */

exports.emailChange = function(req, res){
	var
		token = req.token,
		error = [],
		info = [];
	

	// invalid route for token
	if (token.type != 'email_change') {
		return res.render('tokens/index', {errors: [req.i18n.t('token.error.invalid')]});
	} else {
		mongoose.model('User').findById(token.user, function(err, user){
			if (err) {
				return res.render('tokens/index', {
					errors: [req.i18n.t('token.email_change.error.generic')]
				});
			}
			
			user.email = token.data.email;

			user.save(function(err){
				// TODO render login form
				if (err)
					return res.render('tokens/index', {
						errors: [req.i18n.t('token.email_change.error.generic')]
					});
				else {
					return res.render('tokens/index', {
						info: [req.i18n.t('token.email_change.success')],
						callbackUrl: token.callbackUrl,
						autoRedirect: true
					});
				}
			});
		})
	}
}