
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
	maps = require('maps'),
	layers = require('layers'),
	features = require('features'),
	contents = require('contents'),
	images = require('images'),
	auth = require('./middlewares/authorization');

/**
 * Expose routes
 */

module.exports = function (app, passport) {

	var apiPrefix = '/api/v1';

	app.get('/', home.index);

	/** 
	 * Users routes 
	 **/
	app.get('/login', users.login);
	app.get('/forgot', users.forgot);
	app.post('/forgot', users.sendToken);
	app.get('/signup', users.signup);
	app.get('/logout', users.logout);
	
	app.post('/users', users.create)
	app.put(apiPrefix + '/users', auth.requiresLogin, users.update)
	app.get(apiPrefix + '/users/:userId', users.show)
	app.post('/users/session',
		passport.authenticate('local', {
		failureRedirect: '/login',
		failureFlash: 'Invalid email or password.'
	}), users.session)
	
	// Facebook OAuth routes
	
	app.get('/auth/facebook',
		passport.authenticate('facebook', {
			scope: [ 'email', 'user_about_me'],
			failureRedirect: '/login'
	}), users.signin)
	app.get('/auth/facebook/callback',
		passport.authenticate('facebook', {
		failureRedirect: '/login'
	}), users.authCallback)

	// Twitter OAuth routes

	app.get('/auth/twitter',
		passport.authenticate('twitter', {
		failureRedirect: '/login'
	}), users.signin)
	app.get('/auth/twitter/callback',
		passport.authenticate('twitter', {
		failureRedirect: '/login'
	}), users.authCallback)


	// Google OAuth routes

	app.get('/auth/google',
		passport.authenticate('google', {
		failureRedirect: '/login',
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email'
		]
	}), users.signin)
	app.get('/auth/google/callback',
		passport.authenticate('google', {
		failureRedirect: '/login'
	}), users.authCallback)

	app.param('userId', users.user)

	/** 
	 * Feature routes 
	 **/
	app.param('featureId', features.load) 
	// new feature should be associated to a layer
	app.get(apiPrefix + '/features', features.index);
	app.get(apiPrefix + '/features/:featureId', features.show);
	app.post(apiPrefix + '/layers/:layerId/features', [auth.requiresLogin, auth.feature.requireOwnership] , features.create);	
	app.put(apiPrefix + '/features/:featureId', [auth.requiresLogin, auth.feature.requireOwnership], features.update);
	
	/** 
	 * Content routes 
	 **/
	
	app.param('contentId', contents.load);
	// new content should be associated to a layer
	app.get(apiPrefix + '/contents/:contentId', contents.show);
	app.post(apiPrefix + '/contents', auth.requiresLogin, contents.create);	
	app.put(apiPrefix + '/contents/:contentId', auth.requiresLogin, contents.update);
	app.del(apiPrefix + '/contents/:contentId', auth.requiresLogin, contents.destroy);
	
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
	 * Map routes
	 **/
	app.param('mapId', maps.load);
	app.get(apiPrefix + '/maps', maps.index);
	app.post(apiPrefix + '/maps', auth.requiresLogin, maps.create);
	app.del(apiPrefix + '/maps/:mapId', auth.requiresLogin, maps.destroy);
	app.put(apiPrefix + '/maps/:mapId', auth.requiresLogin, maps.update);
	app.get(apiPrefix + '/maps/:mapId', maps.show);

	
	/**
	 * Images routes
	 **/
	app.param('imageId', images.load);
	app.get(apiPrefix + '/images/:imageId', auth.requiresLogin, images.show);
	app.get('/images', images.showForm);
	app.post(apiPrefix + '/images', auth.requiresLogin, images.create);
	app.del(apiPrefix + '/images', auth.requiresLogin, images.destroy);
	
	/** 
	 * Association routes
	 **/
	
	// layer x feature
	app.put(apiPrefix + '/layers/:layerId/features/:featureId', auth.requiresLogin, layers.addFeature);
	app.del(apiPrefix + '/layers/:layerId/features/:featureId', auth.requiresLogin, layers.removeFeature);
	
	// feature x content
	app.put(apiPrefix + '/features/:featureId/contents/:contentId', auth.requiresLogin, features.addContent);
	app.del(apiPrefix + '/features/:featureId/contents/:contentId', auth.requiresLogin, features.removeContent);

	/*
	 * All other routes enabled for Angular app (no 404)
	 */
	app.get('/*', home.app);

}
