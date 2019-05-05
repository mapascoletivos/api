const request = require('axios');
const apiUrl = global.apiUrl;

/**
 * Get access token for credentials.
 **/
exports.getAccessToken = async function (user) {
  const res = await request.post(apiUrl('/api/v1/access_token/local'), {
    email: user.email,
    password: user.password
  });
  return `Bearer ${res.data.accessToken}`;
};

/**
 * Verify response messages on response bodies.
 */
exports.validResponseMessages = function (body) {
  if (!body.messages) return false;
  if (body.messages.length === 0) return false;
  for (const message of body.messages) {
    // check status
    if (!['error', 'ok'].includes(message.status)) return false;

    // check text
    if (!message.text || message.text.length === 0) return false;
  }
  return true;
};
