
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
	app.put(apiPrefix + '/features/:featureId', auth.requiresLogin, features.update);

	/** 
	 * Content routes 
	 **/

	// load middleware	
	app.param('contentId', content.load);

	// get and put
	app.get(apiPrefix + '/contents/:contentId', content.show);
	app.put(apiPrefix + '/contents/:contentId', auth.requiresLogin, content.update);

	// create new content and associate it to feature and layer
	app.post(apiPrefix + '/features/:featureId/contents', auth.requiresLogin, content.create);

	// remove content from feature, if belongs to only one feature, destroy it
	app.del(apiPrefix + '/features/:featureId/contents/:contentId', auth.requiresLogin, content.remove);


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
	  * Layer x Features routes
	  **/

	// new feature in layer
	app.post(apiPrefix + '/layers/:layerId/features', auth.requiresLogin, layers.createFeature);
	// add existing feature to layer
	app.put(apiPrefix + '/layers/:layerId/features/:featureId', auth.requiresLogin, layers.addFeature);
	// remove feature from layer
	app.del(apiPrefix + '/layers/:layerId/features/:featureId', auth.requiresLogin, layers.removeFeature);



}
