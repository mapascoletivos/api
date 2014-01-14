
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');

/**
 * Controllers dependencies.
 */

var home = require('home'),
	users = require('users');

/**
 * Expose routes
 */

module.exports = function (app, passport) {

  app.get('/', home.index);

  // User routesb
  app.get('/login', users.login);
  // app.get('/signup', users.signup);
  // app.get('/logout', users.logout);
  // app.post('/users', users.create);

  // Feature routes 
  //app.post('/api/v1/feature', features.create);

}
