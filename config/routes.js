
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');

/**
 * Controllers dependencies.
 */

var 
	home = require('home'),
	users = require('users'),
	features = require('features'),
	layers = require('layers'),
	content = require('contents'),
	auth = require('./middlewares/authorization');

/**
 * Route middlewares
 */

var featureAuth = [auth.requiresLogin, auth.feature.hasAuthorization]

/**
 * Expose routes
 */

module.exports = function (app, passport) {

	var apiPrefix = '/api/v1';

	app.get('/', home.index);
	app.get('/home', home.app);

	/** 
	 * Users routes 
	 **/
	app.get('/login', users.login);
	app.get('/signup', users.signup);
	app.get('/logout', users.logout);
	app.post('/users', users.create)
	app.post('/users/session',
		passport.authenticate('local', {
		  failureRedirect: '/login',
		  failureFlash: 'Invalid email or password.'
		})
	, users.session);

	/** 
	 * Feature routes 
	 **/
	app.param('featureId', features.load)
	app.get(apiPrefix + '/features', features.index);
	app.get(apiPrefix + '/features/:featureId', features.show);
	app.post(apiPrefix + '/features', auth.requiresLogin, features.create);
	app.put(apiPrefix + '/features/:featureId', auth.requiresLogin, features.update);
	app.del(apiPrefix + '/features/:featureId', auth.requiresLogin, features.destroy);


	/** 
	 * Layer routes 
	 **/
	app.param('layerId', layers.load);
	app.get(apiPrefix + '/layers', layers.index);
	app.post(apiPrefix + '/layers', auth.requiresLogin, layers.create);
	app.del(apiPrefix + '/layers/:layerId', auth.requiresLogin, layers.destroy);
	app.put(apiPrefix + '/layers/:layerId', auth.requiresLogin, layers.update);
	app.get(apiPrefix + '/layers/:layerId', layers.show);


	/** 
	 * Content routes 
	 **/
	app.param('contentId', content.load);
	app.get(apiPrefix + '/contents/:contentId', content.show);
	app.get(apiPrefix + '/contents', content.index);
	app.post(apiPrefix + '/contents', auth.requiresLogin, content.create);
	app.del(apiPrefix + '/contents/:contentId', auth.requiresLogin, content.destroy);
	app.put(apiPrefix + '/contents/:contentId', auth.requiresLogin, content.update);


}
