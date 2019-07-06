const path = require('path');
const moment = require('moment');
const pug = require('pug');
const nodemailer = require('nodemailer');
const postmark = require('postmark');
const logger = require('./logger');

const mongoose = require('mongoose');
const Token = mongoose.model('Token');

const tplPath = path.join(__dirname, '..', 'app', 'views', 'mailer');

function Mailer (options) {
  var self = this;

  self.options = options.mailer || {};

  // get API server url to use in e-mails
  self.options.serverUrl = options.general.serverUrl;

  switch (self.options.provider) {
    case 'smtp':
      self.transport = nodemailer.createTransport({
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
      self.transport = postmark(self.options.postmark.apikey);
      break;
  }
}

Mailer.prototype.sendEmail = async function (type, to, data, i18n) {
  let self = this;
  try {
    const body = await self.createMessage(type, to, data, i18n);

    switch (self.options.provider) {
      case 'smtp':
        var message = {
          from: self.options.from,
          to: to,
          subject: i18n.t('views.mailer.subjects.' + type),
          html: body
        };
        await self.transport.sendMail(message);
        break;
      case 'postmark':
        await self.transport.send({
          From: self.options.from,
          To: to,
          Subject: i18n.t('views.mailer.subjects.' + type),
          HtmlBody: body
        });
        break;
      default:
        throw new Error('Email transport not defined.');
    }
  } catch (error) {
    logger.error('Mail sending error.', error);
    throw new Error(`Error sending e-mail: ${error.message}.`);
  }
};

Mailer.prototype.createMessage = async function (type, to, data, i18n) {
  let self = this;
  switch (type) {
    case 'confirm_email':
      return pug.renderFile(tplPath + '/email/confirm.jade', {
        t: i18n.t,
        user: data.user,
        token: await self.createToken(type, data),
        serverUrl: self.options.serverUrl,
        appUrl: data.appUrl
      });
    case 'password_reset':
      return pug.renderFile(tplPath + '/password/reset.jade', {
        t: i18n.t,
        user: data.user,
        serverUrl: self.options.serverUrl,
        token: await self.createToken(type, data)
      });
    case 'email_change':
      return pug.renderFile(tplPath + '/email/change.jade', {
        serverUrl: self.options.serverUrl,
        t: i18n.t,
        user: data.user,
        token: await self.createToken(type, data)
      });
    case 'inform_contributor_permission':
      return pug.renderFile(
        tplPath + '/contributions/inform_contributor_permission.jade',
        {
          t: i18n.t,
          layer: data.layer,
          creator: data.creator,
          contributor: data.contributor
        }
      );
    case 'invite_contributor':
      return pug.renderFile(tplPath + '/user/invite.jade', {
        serverUrl: self.options.serverUrl,
        user: data.user,
        i18n: i18n,
        token: await self.createToken(type, data)
      });
    default:
      throw new Error('Mail template not found');
  }
};

Mailer.prototype.createToken = async function (type, data) {
  let token;
  switch (type) {
    case 'confirm_email':
      token = new Token({
        _id: Token.generateId(),
        type: type,
        user: data.user,
        callbackUrl: data.callbackUrl,
        expiresAt: moment()
          .add('day', 1)
          .toDate()
      });
      break;
    case 'password_reset':
      token = new Token({
        _id: Token.generateId(),
        type: 'password_reset',
        user: data.user,
        callbackUrl: data.callbackUrl,
        expiresAt: moment()
          .add('day', 1)
          .toDate()
      });
      break;
    case 'password_definition':
      token = new Token({
        _id: Token.generateId(),
        type: 'password_needed',
        user: data.user,
        callbackUrl: data.callbackUrl,
        expiresAt: moment()
          .add('day', 1)
          .toDate()
      });
      break;
    case 'email_change':
      token = new Token({
        _id: Token.generateId(),
        type: 'email_change',
        user: data.user,
        expiresAt: moment()
          .add('day', 1)
          .toDate(),
        callbackUrl: data.callbackUrl,
        data: { email: data.newEmail }
      });
      break;
    case 'invite_contributor':
      token = new Token({
        _id: Token.generateId(),
        type: 'acceptInvitation',
        data: { user: data.user },
        callbackUrl: data.callbackUrl,
        expiresAt: moment()
          .add('day', 1)
          .toDate()
      });
      break;
  }

  // Save and return token
  if (token) {
    return token.save();
  } else {
    throw new Error('invalid token type');
  }
};

/**
 * Expose
 */

module.exports = Mailer;
