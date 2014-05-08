
/**
 * Module dependencies.
 */

var 
	_ = require('underscore'),
	mongoose = require('mongoose'),
	messages = require('../../lib/messages'),
	validator = require('validator'),
	mailer = require('../../lib/mailer'),
	Settings = mongoose.model('Settings'),
	User = mongoose.model('User');

/**
 * Form to signup the first admin user
 */
exports.firstAdminForm = function(req, res) {
	User.findOne({role: 'admin'}, function(err, admin){
		if (err) return res.render('500');
					
		// If no admin is set, show signup form
		if (!admin)
			res.render('admin/first_admin');
		else
			res.redirect('/admin/login');
	});
}

/**
 * This action is only available when no admin role exists
 */
exports.firstAdmin = function(req, res) {
	
	// Only allows admin creation if no admin exists
	User.findOne({role: 'admin'}, function(err, admin){
		if (err) return res.render('500');
			
		// If an admin user already exists, redirects to login
		if (admin) {
			req.flash('error', req.i18n.t('admin.first_admin.error.already_exists'));
			res.redirect('/admin/login');
		} else {
			var user = new User(req.body);
			var preValidationErrors = [];

			user.role = 'admin';
			user.needsEmailConfirmation = false;

			// Checks existence of all fields before sending to mongoose
			if (!user.name)
				preValidationErrors.push(t('admin.first_admin.error.needs_name'));

			if (!user.email)
				preValidationErrors.push(t('admin.first_admin.error.needs_email'));
			else 
				if (!validator.isEmail(user.email))
					preValidationErrors.push(t('admin.first_admin.error.invalid_email'));

			if (!user.password)
				preValidationErrors.push(t('admin.first_admin.error.password_missing'));
			else if (user.password.length < 6)
				preValidationErrors.push(t('admin.first_admin.error.password_length'));

			if (preValidationErrors.length > 0){
				res.render('admin/first_admin', {messages: messages.errorsArray(preValidationErrors).messages});
			} else {
				user.save(function (err) {
					if (err) {
						res.render('admin/first_admin', messages.mongooseErrors(req.i18n.t, err, 'user'));
					}
					else {
						req.flash('info', req.i18n.t('admin.first_admin.success'));
						res.redirect('/admin/login');
					}
				});
			}
		}
	});
}


exports.login = function(req, res) {
	User.findOne({role: 'admin'}, function(err, admin){
		if (err) return res.render('500');
		else {
			
			// if no admin role is set, redirect to first access
			if (!admin) {
				res.redirect('/admin/first_admin');
			} else {
				res.render('admin/login');
			}
		}
	});
}

exports.logout = function (req, res) {
  req.logout()
  res.redirect('/admin/login')
}

exports.session = function(req, res) {
	res.redirect('/admin');
}

/**
 * Index
 */

exports.index = function (req, res) {
	res.redirect('admin/settings');
}

/**
 * GET API Settings
 */

exports.apiSettings = function(req, res) {
	Settings.load(function(err, settings){
		if (err)
			return res.json(400, message.error(t('admin.api_settings.error.load')));
		else {
			
			// clear mongoose fields
			settings = settings.toObject();
			delete settings._id;
			delete settings.__v;
			delete settings.mailer;
			
			// return object
			return res.json(settings);	
		}

	});
}

exports.users = function(req, res, next) {
	Settings.findOne(function(err, settings){
		res.render('admin/users', {
			messages: err ? messages.errors(err) : '',
			users: settings.users
		});
	});
}


/**
 * General settings form
 */

exports.settings = function(req, res) {
	Settings.load(function(err, settings){
		if (err) res.render('500');
		else {
			res.render('admin/settings', {
				settings: settings.general
			});
		}
	});
}

/**
 * Update settings
 */

exports.update = function(req, res, next) {
	Settings.load(function(err, settings){
		if (err) res.render('500');
		else {

			settings.general = req.body.settings;
						
			settings.general.onlyInvitedUsers = req.body.settings.onlyInvitedUsers ? true : false;
			settings.general.language = req.body.settings.language;
			settings.general.allowImports = req.body.settings.allowImports ? true : false;

			settings.save(function(err){
				if (err) return res.render('500');
				else {

					// Make settings available site wide
					req.app.locals({settings: _.extend(req.app.locals.settings, settings)});
					
					// Render new configuration
					res.render('admin/settings', {
						settings: settings.general
					});
				}
			});
		}
	});
}

/**
 * Mail settings form
 **/

exports.mailForm = function(req, res) {
	res.render('admin/settings/mailer');
}

/**
 * Update mail settings
 **/

exports.mail = function(req, res) {
	Settings.load(function(err, settings){
		if (err) res.render('500');
		else {


			settings.mailer = _.extend(settings.mailer, req.body.mailer);
			settings.mailer.secureConnection = req.body.mailer.secureConnection ? true : false;
			
			settings.save(function(err){
				if (err) res.render('500');
				else {

					// Make settings available site wide
					req.app.locals({settings: _.extend(req.app.locals.settings, settings)});
					
					// Reconfigure mailer with new settings
					req.app.mailer.update(req.app.locals.settings.mailer, function(err){
						if (err) res.render('500');
						else res.render('admin/settings/mailer');
					});
				}
			})
			
		}
	});
}

exports.inviteForm = function(req, res) {
	res.render('admin/users/new');
}

exports.invite = function(req, res, next) {

		
	// Just send mail to users not confirmed
	User.findOne({email: req.body.email}, function(err, user){
		if (err) res.render('500');
		else {
			if (user && !user.needsEmailConfirmation) {
				res.render('admin/users/new', {message: req.i18n.t('admin.invite_user.error.already_active')});
			} else {
				
				var 
					options = {
						mailSender: req.app.mailer,
						user: {
							name: req.body.user.name, 
							email: req.body.user.email, 
							role: req.body.user.role
						},
						callbackUrl: req.app.locals.settings.general.clientUrl + '/login',
						t: req.i18n.t
				}
					
				mailer.invite(options, function(err) {
					if (err) {
						console.log(err);
						next(err);
					}
					else return res.render('admin/users/new', messages.success(req.i18n.t('admin.invite_user.success')));
				});
			}
		}
	})
}


exports.roles = function(req, res, next) {
	User.find({}, function(err, users){
		if (err) res.render('500');
		else res.render('admin/users/roles', {users: users});
	})
}

exports.changeRole = function(req, res, next) {
	var user = req.user;

	User.findById(req.body.user_id, function(err, user){
		if (err || !user) res.render('500');
		else {
			user.role = req.body.role;
			console.log(user);
			user.save(function(err){
				if (err) {
					console.log(err);
					res.render('500');
				}
				else {
					User.find({}, function(err, users){
						if (err) res.render('500');
						else res.redirect('admin/users/roles');
					})
				}
			})
		}
	});
	

}