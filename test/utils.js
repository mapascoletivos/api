const request = require('axios');
const apiUrl = global.apiUrl;

/**
 * Get access token for credentials.
 **/
exports.getAccessToken = async function (email, password) {
  const res = await request.post(apiUrl('/api/v1/access_token/local'), {
    email,
    password
  });
  return `Bearer ${res.data.accessToken}`;
};
