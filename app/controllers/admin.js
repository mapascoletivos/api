
/**
 * Module dependencies.
 */

var 
	_ = require('underscore'),
	mongoose = require('mongoose'),
	messages = require('../../lib/messages'),
	mailer = require('../mailer'),
	Settings = mongoose.model('Settings'),
	User = mongoose.model('User');


exports.login = function(req, res) {
	res.render('admin/login');
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
 * Show general settings
 */

exports.settings = function(req, res) {
	Settings.findOne(function(err, settings){
		res.render('admin/settings', {
			messages: err ? messages.errors(err) : '',
			site: settings.site
		});
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
 * Udpate settings
 */

exports.update = function(req, res, next) {

	Settings.findOne(function(err, settings){
		if (err) 
			res.render('admin/settings', {messages: messages.errors(err)});
		else {
			if (!settings) 
				settings = new Settings();

			settings = _.extend(settings, req.body);
			
			
			settings.save(function(err){
				req.app.locals(settings.toObject());
				
				if (req.body.users) 
					res.redirect('/admin/users');
				else if (req.body.site)
					res.redirect('/admin/settings');
				else
					res.redirect('/admin');
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