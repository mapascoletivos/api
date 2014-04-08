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

	
	welcome: function(user, callback_url, callback){
		var
			Token = mongoose.model('Token'),
			token = new Token({
				_id: Token.generateId(),
				type: 'activateAccount',
				user: user,
				callbackUrl: callback_url,
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
				_id: Token.generateId(),
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

	passwordNeeded: function(user, callbackUrl, callback) {
		var
			Token = mongoose.model('Token'),
			token = new Token({
				_id: Token.generateId(),
				type: 'password_needed',
				user: user,
				callbackUrl: callbackUrl,
				expiresAt: moment().add('day', 1).toDate()
			});

		token.save(function(err){
			if (err) {
				callback(err);
			} else {
				jade.renderFile(tplPath + '/password_needed.jade', { user: user, token: token, appUrl: config.appUrl }, function(err, file) {
					if (err) {
						callback(err);
					} else {
						var 
							options = _.extend(mailConfig, {
								subject: 'Definição de senha',
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

	changeEmail: function(user, newEmail, callbackUrl, callback){
		var
			Token = mongoose.model('Token'),
			token = new Token({
				_id: Token.generateId(),
				type: 'email_change',
				user: user,
				expiresAt: moment().add('day', 1).toDate(),
				callbackUrl: callbackUrl,
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
	},
	migrateAccount: function(user, newPassword, callback){
		var
			Token = mongoose.model('Token'),
			token = new Token({
				_id: Token.generateId(),
				type: 'migrate_account',
				user: user,
				expiresAt: moment().add('day', 1).toDate(),
				data: { password: newPassword}
			});


		token.save(function(err){
			if (err) {
				callback(err);
			} else {
				jade.renderFile(tplPath + '/migrate_account.jade', { user: user, token: token, appUrl: config.appUrl }, function(err, file) {
					if (err) {
						console.log(err);
						callback(err);
					} else {
						var 
							options = _.extend(mailConfig, {
								subject: 'Migração de conta',
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

	informContributorPermission: function(layer, creator, contributor, callback){

		jade.renderFile(tplPath + '/inform_contributor_permission.jade', { layer: layer, creator: creator, contributor: contributor, appUrl: config.appUrl }, function(err, file) {
			if (err) {
				console.log(err);
				callback(err);
			} else {
				var 
					options = _.extend(mailConfig, {
						subject: 'Permissão para edição de camada',
						to: contributor.email, 
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
	},
	
	invite: function(options, callback) {
		var
			Token = mongoose.model('Token'),
			token = new Token({
				_id: Token.generateId(),
				type: 'acceptInvitation',
				data: {user: options.user},
				callbackUrl: options.callbackUrl,
				expiresAt: moment().add('day', 1).toDate()
			});

		console.log(options);

		token.save(function(err){
			if (err)
				callback(err);
			else {
				jade.renderFile(tplPath + '/user_invitation.jade', { token: token, serverUrl: options.serverUrl }, function(err, file) {
					if (err)
						callback(err);
					else {

						var 
							sendConfiguration = _.extend(mailConfig, {
								subject: 'Convite ao mapeamento',
								to: options.user.email, 
								html: file
							});
						
						transport.sendMail(sendConfiguration, function(err, response){
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
	}

}

/**
 * Expose
 */

module.exports = Notify