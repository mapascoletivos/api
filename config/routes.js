
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
	auth = require('./middlewares/authorization');

/**
 * Route middlewares
 */

var featureAuth = [auth.requiresLogin, auth.feature.hasAuthorization]

/**
 * Expose routes
 */

module.exports = function (app, passport) {

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
	app.get('/features', features.index)
	app.get('/features/new', auth.requiresLogin, features.new)
	app.post('/features', auth.requiresLogin, features.create)
	app.get('/features/:featureId', features.show)
	app.get('/features/:featureId/edit', featureAuth, features.edit)	
	app.put('/features/:featureId', featureAuth, features.update)
	app.del('/features/:featureId', featureAuth, features.destroy)

	app.get('/api/v1/features.:format?', features.index);
	app.get('/api/v1/features/:featureId.:format?', features.show);
	app.post('/api/v1/features', auth.requiresLogin, features.create);

	/** 
	 * Layer routes 
	 **/
	app.param('layerId', layers.load);
	app.get('/app/layers/new', auth.requiresLogin, layers.new);
	app.get('/api/v1/layers/new', auth.requiresLogin, layers.newDraft);
	app.put('/api/v1/layers/:layerId', auth.requiresLogin, layers.update);
	app.get('/api/v1/layers.:format?', layers.index);
	app.get('/api/v1/layers/:layerId.:format?', layers.show);



}
