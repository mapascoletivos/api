const request = require('axios');
const logger = require('./logger');
const config = require('config');
const secret = config.get('recaptchaSecret');

module.exports = async function (response) {
  try {
    const { data } = await request({
      method: 'post',
      url: 'https://www.google.com/recaptcha/api/siteverify',
      params: {
        secret: secret,
        response: response
      }
    });
    return data && data.success;
  } catch (error) {
    logger.error('Could not fetch reCaptcha verification.');
    return false;
  }
};
