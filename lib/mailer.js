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


Mailer.prototype.sendEmail = function(type, to, data, i18n, callback){

	var self = this;

	self.createMessage(type, to, data, i18n, function(err, body){
		if (err) return callback(err);

		switch (self.options.provider) {
			case 'smtp':
				var message = {
					from: self.options.from,
					to: to,
					subject: i18n.t('views.mailer.subjects.' + type),
					html: body
				}
				self.transport.sendMail(message,callback);
				break;
			case 'postmark':
				self.transport.send({
					"From": self.options.from, 
					"To": to, 
					"Subject": i18n.t('views.mailer.subjects.' + options.type), 
					"HtmlBody": body
				}, callback)
				break;
			default:
				callback(new Error('Email transport not defined.'));
		}
	});

}

Mailer.prototype.createMessage = function(type, to, data, i18n, callback){

	var self = this;

	switch (type) {
		// TODO Check this email send
		case 'email_confirmation':
			self.createToken(data, function(err, token){
				if (err) callback(err)
				else 
					jade.renderFile(tplPath + '/account/migrate_account.jade', { 
						user: data.user, 
						token: data.token, 
						appUrl: data.appUrl 
					}, callback);
			})
			break;
		case 'password_reset':
			self.createToken(type, data, function(err, token){
				if (err) callback(err)
				else 
					jade.renderFile(tplPath + '/password/recover.jade', { 
						i18n: i18n,
						user: data.user, 
						serverUrl: self.options.serverUrl,
						token: token
					}, callback);
			});
			break;
		// TODO Check this email send
		case 'password_needed':
			jade.renderFile(tplPath + '/password/set.jade', { 
				to: data.user.email, 
				user: data.user,
				token: token
			}, callback);
		case 'email_change': 
			self.createToken(type, data, function(err, token){
				if (err) callback(err)
				else 
					jade.renderFile(tplPath + '/email/change.jade', { 
						serverUrl: self.options.serverUrl,
						t: i18n.t,
						user: data.user,
						token: token
					}, callback);
			});
			break;
		// TODO Check this email send
		case 'migrate_account': 
			jade.renderFile(tplPath + '/account/migrate_account.jade', { 
				user: user, 
				token: token, 
				appUrl: config.appUrl 
			}, callback);
			break;
		// TODO Check this email send
		case 'inform_contributor_permission':
			jade.renderFile(tplPath + '/contributions/inform_contributor_permission.jade', { 
				layer: data.layer, 
				creator: data.creator, 
				contributor: data.contributor
			}, callback);
			break;
		case 'invite_contributor':
			self.createToken(type, data, function(err, token){
				if (err) return callback(err);
				
				jade.renderFile(tplPath + '/user/invite.jade', { 
					serverUrl: self.options.serverUrl,
					user: data.user,
					i18n: i18n,
					token: token
				}, callback);
			});
			break;
		default:
			callback(new Error('Mail template not found'));
	}
}

Mailer.prototype.createToken = function(type, data, callback){

	var self = this;

	switch (type) {
		case 'email_confirmation':
			token = new Token({
				_id: Token.generateId(),
				type: 'activateAccount',
				user: data.user,
				callbackUrl: data.callbackUrl,
				expiresAt: moment().add('day', 1).toDate()
			});
			token.save(callback);
			break;
		case 'password_reset':
			token = new Token({
				_id: Token.generateId(),
				type: 'password_reset',
				user: data.user,
				callbackUrl: data.callbackUrl,
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
				user: data.user,
				expiresAt: moment().add('day', 1).toDate(),
				callbackUrl: data.callbackUrl,
				data: { email: data.newEmail}
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
				data: {user: data.user},
				callbackUrl: data.callbackUrl,
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