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

	var self = this;

	self.options = options.mailer || {};

	// get API server url to use in e-mails
	self.options.serverUrl = options.general.serverUrl;

	console.log(self.options);

	switch (self.options.provider) {
		case 'smtp': 
			self.transport = nodemailer.createTransport("SMTP", {
				host: self.options.smtp.host || '', // hostname
				secureConnection: self.options.smtp.secureConnection || false, // use SSL
				port: self.options.smtp.port || 25, // port for secure SMTP
				auth: {
					user: self.options.smtp.user,
					pass: self.options.smtp.pass
				}
			});
			break;
		case 'postmark':
			self.transport = postmark(self.options.postmark.apikey)
			break;
	}

}


Mailer.prototype.sendEmail = function(options, i18n, callback){

	var self = this;

	self.createMessage(options, i18n, function(err, body){
		if (err) return callback(err);

		switch (self.options.provider) {
			case 'smtp':
				var message = {
					from: self.options.from,
					to: options.to,
					subject: i18n.t('views.mailer.subjects.' + options.type),
					html: body
				}
				console.log(self.transport);
				self.transport.sendMail(message,callback);
				break;
			case 'postmark':
				self.transport.send({
					"From": self.options.from, 
					"To": options.to, 
					"Subject": i18n.t('views.mailer.subjects.' + options.type), 
					"HtmlBody": body
				}, callback)
				break;
			default:
				callback(new Error('Email transport not defined.'));
		}
	});

}

Mailer.prototype.createMessage = function(options, i18n, callback){

	var self = this;

	switch (options.type) {
		case 'email_confirmation':
			selfthis.createToken(options, function(err, token){
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
			self.createToken(options, function(err, token){
				if (err) return callback(err);
				
				jade.renderFile(tplPath + '/user/invite.jade', { 
					user: options.user,
					i18n: i18n,
					serverUrl: self.options.serverUrl,
					token: token
				}, callback);
			});
			break;
		default:
			callback(new Error('Mail template not found'));
	}
}

Mailer.prototype.createToken = function(options, callback){

	var self = this;

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
		case 'invite_contributor':
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