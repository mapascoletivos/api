
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
	users = require('users')

/**
 * Expose
 */

module.exports = function (app, passport) {

  app.get('/', home.index)

  // Users routes
  //app.get('/signup', users.index)
}
