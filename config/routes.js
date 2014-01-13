
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
var passportOptions = {
  failureFlash: 'Invalid email or password.',
  failureRedirect: '/login'
}

// controllers
var home = require('home'),
	users = require('users');

/**
 * Expose
 */

module.exports = function (app, passport) {

  app.get('/', home.index)

  // Feature routes 
  //app.post('/api/v1/feature', features.create);

}
