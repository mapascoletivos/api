/**
 * Module dependencies.
 */

var 
	_ = require('underscore'),
	mongoose = require('mongoose'),
	moment = require('moment'),
	jade = require('jade'),
	tplPath = require('path').normalize(__dirname + '/../app/views/mailer');

/**
 * Notification methods
 */

var Mailer = {

	
	confirmEmail: function(options, callback){
		var
			Token = mongoose.model('Token'),
			token = new Token({
				_id: Token.generateId(),
				type: 'activateAccount',
				user: options.user,
				callbackUrl: options.callbackUrl,
				expiresAt: moment().add('day', 1).toDate()
			});

		token.save(function(err){
			if (err)
				callback(err);
			else {

				options.mailSender.send('mailer/email/confirm', { 
					subject: 'Confirmação de e-mail',
					to: options.user.email, 
					user: options.user,
					token: token
				}, callback);
			}
		})
	},
		
	passwordReset: function(options, callback){
		var
			Token = mongoose.model('Token'),
			token = new Token({
				_id: Token.generateId(),
				type: 'password_reset',
				user: options.user,
				callbackUrl: options.callbackUrl,
				expiresAt: moment().add('day', 1).toDate()
			});

		token.save(function(err){
			if (err)
				callback(err);
			else {
				options.mailSender.send('mailer/password/recover', { 
					subject: 'Recuperação de Senha',
					to: options.user.email, 
					user: options.user,
					token: token
				}, callback);
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

				mailSender.send('mailer/password/set', { 
					subject: 'Definição de Senha',
					to: options.user.email, 
					user: options.user,
					token: token
				}, callback);


			}
		});
	},

	changeEmail: function(options, callback){
		var
			Token = mongoose.model('Token'),
			token = new Token({
				_id: Token.generateId(),
				type: 'email_change',
				user: options.user,
				expiresAt: moment().add('day', 1).toDate(),
				callbackUrl: options.callbackUrl,
				data: { email: options.newEmail}
			});

		token.save(function(err){
			if (err) {
				callback(err);
			} else {
				options.mailSender.send('mailer/email/change', { 
					subject: options.t('views.mailer.email.change.subject'),
					t: options.t,
					to: options.newEmail, 
					user: options.user,
					token: token
				}, callback);

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
				jade.renderFile(tplPath + '/account/migrate_account.jade', { user: user, token: token, appUrl: config.appUrl }, function(err, file) {
					if (err) {
						callback(err);
					} else {
						var 
							options = _.extend(mailConfig, {
								subject: options.t('views.mailer.user.account.migrate.subject'),
								t: options.t,
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

// 	informContributorPermission: function(layer, creator, contributor, callback){
	informContributorPermission: function(options, callback){


		options.mailSender.send('mailer/contributions/inform_contributor_permission', { 
				subject: options.t('views.mailer.contributions.new_contributor.subject'),
				to: options.contributor.email,
				t: options.t,
				layer: options.layer, 
				creator: options.creator, 
				contributor: options.contributor
		}, callback);
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


		token.save(function(err){
			if (err)
				callback(err);
			else {

				options.mailSender.send('mailer/user/invite', { 
					subject: options.t('views.mailer.user.invite.subject'),
					to: options.user.email, 
					user: options.user,
					t: options.t,
					token: token
				}, callback);
			}
		});
	}

}

/**
 * Expose
 */

module.exports = Mailer