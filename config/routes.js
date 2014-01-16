
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
	auth = require('./middlewares/authorization');

/**
 * Expose routes
 */

module.exports = function (app, passport) {

	app.get('/', home.index);

	// User routes
	app.get('/login', users.login);
	app.get('/signup', users.signup);
	app.get('/logout', users.logout);
	app.post('/users', users.create)
	app.get('/dashboard', users.dashboard);
	app.post('/users/session',
		passport.authenticate('local', {
		  failureRedirect: '/login',
		  failureFlash: 'Invalid email or password.'
		})
	, users.session);

	// Feature routes 
  app.param('featureId', features.load)
	app.get('/features/new', auth.requiresLogin, features.new)
	app.post('/features', auth.requiresLogin, features.create)
	app.get('/features/:featureId', features.show)
	// app.put('/features/:id', articleAuth, features.update)
	// app.del('/features/:id', articleAuth, features.destroy)
	// app.put('/features/:feaureId/add/media/:featureId', layerAuth, layers.addFeature)

	// Layers routes
	// app.param('layerId', layers.load)
	// app.get('/layers/new', auth.requiresLogin, layers.new)
	// app.post('/layers', auth.requiresLogin, layers.create)
	// app.get('/layers/:layerId', layers.show)
	// app.put('/layers/:layerId', articleAuth, layers.update)
	// app.del('/layers/:layerId', articleAuth, layers.destroy)
	// app.put('/layers/:layerId/add/feature/:featureId', layerAuth, layers.addFeature)
	// app.put('/layers/:layerId/remove/feature/:featureId', layerAuth, layers.addFeature)	
	// app.put('/layers/:layerId/add/media/:mediaId', layerAuth, layers.addFeature)
	// app.put('/layers/:layerId/remove/media/:mediaId', layerAuth, layers.addFeature)	
	// app.put('/layers/:layerId/associate/media/:mediaId/to/feature/:featureId', layerAuth, layers.addFeature)
	// app.put('/layers/:layerId/dissociate/media/:mediaId/from/feature/:featureId', layerAuth, layers.addFeature)

}
