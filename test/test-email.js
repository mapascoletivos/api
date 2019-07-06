const { join } = require('path');
const request = require('supertest');
const pug = require('pug');
const { createUser, resetFixtures } = require('./fixtures');
const i18n = require('../lib/i18n');

const apiPrefix = '/api/v1';
const app = global.server;
const templatesPath = join(__dirname, '..', 'app', 'views', 'mailer');

let user1;

describe('E-mail notifications', function () {
  before(async function () {
    await resetFixtures();
    user1 = await createUser();
  });

  it('/forgot_password should return error when emails is not configured', async function () {
    await request(app)
      .post(apiPrefix + '/forgot_password')
      .send({
        emailOrUsername: user1.email
      })
      .expect('Content-Type', /json/)
      .expect(500);
  });

  it('render "activate account" e-mail from options', async function () {
    const body = pug.renderFile(templatesPath + '/email/confirm.jade', {
      t: i18n.t,
      user: { name: 'user' },
      token: { _id: 'token-string' },
      serverUrl: 'http://localhost:3000',
      appUrl: 'http://localhost:8000'
    });

    body.should.be.equal(
      '<p>Hi, user,</p><p>Your e-mail address need to be confirmed to activate your account. Please visit the link to proceed:</p><p>http://localhost:3000/confirm_email/token-string</p><p>Nice mapping!</p>'
    );
  });

  it('render "change e-mail address" e-mail from options', async function () {
    const body = pug.renderFile(templatesPath + '/email/change.jade', {
      t: i18n.t,
      user: { name: 'user' },
      token: { _id: 'token-string' },
      serverUrl: 'http://localhost:3000',
      appUrl: 'http://localhost:8000'
    });

    body.should.be.equal(
      '<p>Hi, user,</p><p>Please visit the link to associate this e-mail address to your account:</p><p>http://localhost:3000/email_change/token-string</p><p>Nice mapping!</p>'
    );
  });

  it('render "reset password" e-mail from options', async function () {
    const body = pug.renderFile(templatesPath + '/password/reset.jade', {
      t: i18n.t,
      user: { name: 'user' },
      token: { _id: 'token-string' },
      serverUrl: 'http://localhost:3000',
      appUrl: 'http://localhost:8000'
    });

    body.should.be.equal(
      '<p>Hi, user,</p><p>Please visit the link to define a new password.</p><p>http://localhost:3000/new_password/token-string</p><p>Or ignore this e-mail if you didn\'t requested a password reset.</p><p>Nice mapping!</p>'
    );
  });
});
