
/**
 * Module dependencies.
 */

var 
	_ = require('underscore'),
	mongoose = require('mongoose'),
	messages = require('../../lib/messages'),
	validator = require('validator'),
	mailer = require('../mailer'),
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
			
		// If an admin user already existes, redirects to login
		if (admin) {
			console.log('admin already exists');
			req.flash('error', 'An admin already exists.');
			res.redirect('/admin/login');
		} else {
			var user = new User(req.body);
			var preValidationErrors = [];

			user.role = 'admin';
			user.needsEmailConfirmation = false;

			// Checks existence of all fields before sending to mongoose
			if (!user.name)
				preValidationErrors.push('Please enter a name.');

			if (!user.email)
				preValidationErrors.push('Please enter a e-mail address.');
			else 
				if (!validator.isEmail(user.email))
					preValidationErrors.push('Invalid e-mail address.');

			if (!user.password)
				preValidationErrors.push('Please type a password.');
			else if (user.password.length < 6)
				preValidationErrors.push('Password should have at least 6 characters.');

			if (preValidationErrors.length > 0){
				res.render('admin/first_admin', {messages: messages.errorsArray(preValidationErrors).messages});
			} else {
				user.save(function (err) {
					if (err) {
						res.render('admin/first_admin', {messages: messages.mongooseErrors(err)});
					}
					else {
						req.flash('info', 'Admin created successfully.');
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
	res.render('admin/index');
}

/**
 * GET API Settings
 */

exports.apiSettings = function(req, res) {
	Settings.load(function(err, settings){
		if (err)
			return res.json(400, message.error('Could not retrive server info.'));
		else {
			
			// clear mongoose fields
			settings = settings.toObject();
			delete settings._id;
			delete settings.__v;
			
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
 * Settings form
 */

exports.settings = function(req, res) {
	Settings.load(function(err, settings){
		if (err) res.render('500');
		else {
			res.render('admin/settings', {
				settings: settings
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
			console.log(req.body.settings);
			settings = _.extend(settings, req.body.settings);

			settings.save(function(err){
				if (err) return res.render('500');
				else {

					// Make settings available site wide
					req.app.locals(settings.toObject());
					
					res.render('admin/settings', {
						settings: settings
					});
				}
			});
		}
	});
}

exports.inviteForm = function(req, res) {
	res.render('admin/users/new');
}

exports.invite = function(req, res, next) {

		
	// Just send mail to users not confirmed
	User.findOne({email: req.body.email}, function(err, user){
		if (err) res.render('admin/users/new');
		else {
			if (user && !user.needsEmailConfirmation) {
				res.render('admin/users/new', {message: 'User already active.'});
			} else {
				
				var 
					options = {
						user: {
							name: req.body.user.name, 
							email: req.body.user.email, 
							role: req.body.user.role
						},
						serverUrl: req.app.locals.site.serverUrl,
						callbackUrl: req.app.locals.site.clientUrl + '/login'
				}
					
				mailer.invite(options, function(err) {
					if (err) {
						console.log(err);
						next(err);
					}
					else return res.render('admin/users/new', {messages: messages.success('User invited successfully')});
				});
			}
		}
	})
}


exports.permissions = function(req, res, next) {
	res.render('admin/users/permissions');
}