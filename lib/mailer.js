/**
 * Module dependencies.
 */

var 
	_ = require('underscore'),
	mongoose = require('mongoose'),
	moment = require('moment'),
	jade = require('jade'),
	tplPath = require('path').normalize(__dirname + '/../app/views/mailer'),
	nodemailer = require('nodemailer'),
	postmark = require('postmark');

var Token = mongoose.model('Token');



function Mailer(options){

	this.options = options || {};


	switch (this.options.transport_type) {
		case 'smtp':
			this.transport = nodemailer.createTransport("SMTP", {
				host: this.options.host || '', // hostname
				secureConnection: this.options.secureConnection || false, // use SSL
				port: this.options.secureConnection || 25, // port for secure SMTP
				auth: {
					user: this.options.user,
					pass: this.options.password
				}
			});
			break;
		case 'postmark':
			this.transport = postmark(this.options.postmark.apikey)
			break;
	}

}

Mailer.prototype.sendEmail = function(options, callback){
	switch (this.transport) {
		case 'smtp':
			var message = {
				from: this.options.from,
				to: options.to,
				subject: options.subject,
				html: options.body
			}
			this.transport.sendEmail(message,callback);
			break;
		case 'postmark':
			this.transport.send({
				"From": this.options.from, 
				"To": options.to, 
				"Subject": options.to, 
				"TextBody": options.body
			}, callback)
			break;
		default:
			callback(new Error('Email transport not defined.'));
	}
}

Mailer.prototype.createEmailBody = function(options, callback){
	switch (options.type) {
		case 'email_confirmation':
			this.createToken(options, function(err, token){
				if (err) callback(err)
				else 
					jade.renderFile(tplPath + '/account/migrate_account.jade', { 
						user: options.user, 
						token: options.token, 
						appUrl: options.appUrl 
					}, callback);
			})
			break;
		case 'password_reset':
			jade.renderFile(tplPath + 'mailer/password/recover', { 
				user: options.user, 
				subject: 'Recuperação de Senha',
				to: options.user.email, 
				user: options.user,
				token: token
			}, callback);
			break;
		case 'password_needed':
			jade.renderFile(tplPath + 'mailer/password/set', { 
				to: options.user.email, 
				user: options.user,
				token: token
			}, callback);
		case 'change_email': 
			jade.renderFile(tplPath + 'mailer/email/change', { 
					subject: options.t('views.mailer.email.change.subject'),
					t: options.t,
					to: options.newEmail, 
					user: options.user,
					token: token
				}, callback);
		case 'migrate_account': 
			jade.renderFile(tplPath + '/account/migrate_account.jade', { 
				user: user, 
				token: token, 
				appUrl: config.appUrl 
			}, callback);
			break;
		case 'inform_contributor_permission':
			jade.renderFile(tplPath + 'mailer/contributions/inform_contributor_permission', { 
				layer: options.layer, 
				creator: options.creator, 
				contributor: options.contributor
			}, callback);
			break;
		case 'invite_contributor':
			jade.renderFile(tplPath + 'mailer/user/invite', { 
				user: options.user,
				t: options.t,
				token: token
			}, callback);
			break;
		default:
			callback(new Error('Mail template not found'));
	}
}

Mailer.prototype.createToken = function(options, callback){
	switch (options.type) {
		case 'email_confirmation':
			token = new Token({
				_id: Token.generateId(),
				type: 'activateAccount',
				user: options.user,
				callbackUrl: options.callbackUrl,
				expiresAt: moment().add('day', 1).toDate()
			});
			token.save(callback);
			break;
		case 'password_reset':
			token = new Token({
				_id: Token.generateId(),
				type: 'password_reset',
				user: options.user,
				callbackUrl: options.callbackUrl,
				expiresAt: moment().add('day', 1).toDate()
			});
			token.save(callback);
			break;
		case 'password_definition':
			token = new Token({
				_id: Token.generateId(),
				type: 'password_needed',
				user: user,
				callbackUrl: callbackUrl,
				expiresAt: moment().add('day', 1).toDate()
			});
			token.save(callback);
			break;
		case 'email_change':
			token = new Token({
				_id: Token.generateId(),
				type: 'email_change',
				user: options.user,
				expiresAt: moment().add('day', 1).toDate(),
				callbackUrl: options.callbackUrl,
				data: { email: options.newEmail}
			});
			token.save(callback);
			break;
		case 'migrate_account':
			token = new Token({
				_id: Token.generateId(),
				type: 'migrate_account',
				user: user,
				expiresAt: moment().add('day', 1).toDate(),
				data: { password: newPassword}
			});
			token.save(callback);
			break;
		case 'invitation':
			token = new Token({
				_id: Token.generateId(),
				type: 'acceptInvitation',
				data: {user: options.user},
				callbackUrl: options.callbackUrl,
				expiresAt: moment().add('day', 1).toDate()
			});
			token.save(callback);
			break;
		default:
			callback(new Error('invalid token type'));
	}
}



/**
 * Expose
 */

module.exports = Mailer