/**
 * Module dependencies.
 */

var 
	mongoose = require('mongoose'),
	env = process.env.NODE_ENV || 'development',
	config = require('../../config/config')[env],
	moment = require('moment'),
	nodemailer = require('nodemailer'),
	jade = require('jade'),
	tplPath = require('path').normalize(__dirname + '/../mailer/templates'),
	_ = require('underscore');

var mailConfig = { from: config.nodemailer.from };
	
var transport = nodemailer.createTransport('SMTP', config.nodemailer);



/**
 * Notification methods
 */

var Notify = {

	
	welcome: function(user, callback){
		var
			Token = mongoose.model('Token'),
			token = new Token({
				type: 'activateAccount',
				user: user,
				expiresAt: moment().add('day', 1).toDate()
			});
		
		token.save(function(err){
			if (err)
				callback(err);
			else {
				jade.renderFile(tplPath + '/welcome.jade', { user: user, token: token, appUrl: config.appUrl }, function(err, file) {
					if (err)
						callback(err);
					else {
						var 
							options = _.extend(mailConfig, {
								subject: 'Bem-vindo ao Mapas Coletivos',
								to: user.email, 
								html: file
							});

						transport.sendMail(options, function(err, response){
							if (err) 
								callback(err);
							else {
								console.log("Message sent: " + response.message);
								callback();
							}
						});
					}
				});
			}
		})
	},
		
	passwordReset: function(user, callback){
		var
			Token = mongoose.model('Token'),
			token = new Token({
				type: 'password_reset',
				user: user,
				expiresAt: moment().add('day', 1).toDate()
			});

		token.save(function(err){
			if (err)
				callback(err);
			else {
				jade.renderFile(tplPath + '/password_reset.jade', { user: user, token: token, appUrl: config.appUrl }, function(err, file) {
					if (err)
						callback(err);
					else {
						var 
							options = _.extend(mailConfig, {
								subject: 'Recuperação de Senha',
								to: user.email, 
								html: file
							});

						transport.sendMail(options, function(err, response){
							if (err) 
								callback(err);
							else {
								console.log("Message sent: " + response.message);
								callback();
							}
						});
					}
				});
			}
		});
	},

	passwordUpdate: function(user, callback) {
		var
			Token = mongoose.model('Token'),
			token = new Token({
				type: 'password_update',
				user: user,
				expiresAt: moment().add('day', 1).toDate()
			});

		token.save(function(err){
			if (err) {
				callback(err);
			} else {
				jade.renderFile(tplPath + '/password_update.jade', { user: user, token: token, appUrl: config.appUrl }, function(err, file) {
					if (err) {
						callback(err);
					} else {
						var 
							options = _.extend(mailConfig, {
								subject: 'Atualização de senha',
								to: user.email, 
								html: file
							});

						transport.sendMail(options, function(err, response){
							if (err) {
								callback(err);
							} else {
								console.log("Message sent: " + response.message);
								callback();
							}
						});
					}
				});
			}
		});
	},

	changeEmail: function(user, newEmail, callback){
		var
			Token = mongoose.model('Token'),
			token = new Token({
				type: 'email_change',
				user: user,
				expiresAt: moment().add('day', 1).toDate(),
				data: { email: newEmail}
			});

		token.save(function(err){
			if (err) {
				callback(err);
			} else {
				jade.renderFile(tplPath + '/email_change.jade', { user: user, token: token, appUrl: config.appUrl }, function(err, file) {
					if (err) {
						callback(err);
					} else {
						var 
							options = _.extend(mailConfig, {
								subject: 'Confirmação de alteração de email',
								to: newEmail, 
								html: file
							});

						transport.sendMail(options, function(err, response){
							if (err) {
								callback(err);
							} else {
								console.log("Message sent: " + response.message);
								callback();
							}
						});
					}
				});
			}
		});		
	}
}

/**
 * Expose
 */

module.exports = Notify