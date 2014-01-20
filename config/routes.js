
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
	app.get('/explore', home.explore);

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
	// app.put('/features/:feaureId/add/media/:featureId', layerAuth, layers.addFeature)

	app.get('/api/v1/features.:format?', features.index	);
	app.get('/api/v1/features/:featureId.:format?', features.show );
	app.post('/api/v1/features', auth.requiresLogin, features.create)	


	// Layers routes
	app.param('layerId', layers.load)
	app.get('/layers/new', auth.requiresLogin, layers.new)
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

	// Partials route and rendering
	app.get('/partials/:view/:partial', function(req, res) {
		res.render('partials/' + req.params.view + '/' + req.params.partial);
	});

}
