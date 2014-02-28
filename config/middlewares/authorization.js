var _ = require('underscore');
var mongoose = require('mongoose');
var Layer = mongoose.model('Layer');

/*
 *  Generic require login routing middleware
 */

exports.requiresLogin = function (req, res, next) {
	if (req.isAuthenticated()) return next()
	if (req.method == 'GET') req.session.returnTo = req.originalUrl
	res.redirect('/login')
}

/*
 *  Feature authorization 
 */

exports.feature = {


	canEditOrDelete: function(req, res, next) {

		var checkPermission = function(layer, feature, user){

			layerCreatorId = (layer.creator._id || layer.creator).toHexString(); 
			featureCreatorId = (feature.creator._id || feature.creator).toHexString();
			userId = user._id.toHexString();

			// is layer or feature creator
			if ((featureCreatorId == userId) || (layerCreatorId == userId)) {
				next();
			} else {
				return res.json(403, {
					messages: [{
						status: 'error',
						text: 'Você não tem permissão para fazer isso.'
					}]
				});
			}
		}

		if (!req.layer) {
			Layer.findById(req.query.layerId, function(err, layer){
				if (err) {
					return res.json(403, {
						messages: [{
							status: 'error',
							text: 'Camada não encontrada.'
						}]
					});
				} else {
					checkPermission(layer, req.feature, req.user);
				}
			});
		} else {
			checkPermission(req.layer, req.feature, req.user);
		}


	},


	canCreate: function(req, res, next) {

		var isContributor = function(layer, user) {
			return _.find(layer.contributors, function(c) {
				if(!c._id) {
					return c == user._id.toHexString();
				} else {
					return c._id.toHexString() == user._id.toHexString();
				}
			})
		}

		var isCreator = function(layer, user) {
			if(layer.creator._id) {
				return user._id.toHexString() == layer.creator._id.toHexString();
			} else {
				return user._id.toHexString() == layer.creator;
			}
		}

		// is layer creator or contributor
		if (typeof isContributor(req.layer, req.user) == 'undefined' && !isCreator(req.layer, req.user)) {
			return res.json(403, {
				messages: [{
					status: 'error',
					text: 'Você não tem permissão para fazer isso.'
				}]
			});
		} else {
			next();
		}
	}
}

/*
 *  Content authorization 
 */

exports.content = {


	canEditOrDelete: function(req, res, next) {

		var checkPermission = function(layer, content, user){

			layerCreatorId = (layer.creator._id || layer.creator).toHexString(); 
			contentCreatorId = (content.creator._id || content.creator).toHexString();
			userId = user._id.toHexString();

			// is layer or content creator
			if ((contentCreatorId == userId) || (layerCreatorId == userId)) {
				next();
			} else {
				return res.json(403, {
					messages: [{
						status: 'error',
						text: 'Você não tem permissão para fazer isso.'
					}]
				});
			}
		}

		Layer.findById((req.content.layer || req.body.layer._id || req.body.layer), function(err, layer){
			if ((err) || (!layer)){
				return res.json(403, {
					messages: [{
						status: 'error',
						text: 'Erro ao carregar a camada.'
					}]
				});
			} else {
				checkPermission(layer, req.content, req.user);
			}
		});
	},


	canCreate: function(req, res, next) {

		var isContributor = function(layer, user) {
			return _.find(layer.contributors, function(c) {
				if(!c._id) {
					return c == user._id.toHexString();
				} else {
					return c._id.toHexString() == user._id.toHexString();
				}
			})
		}

		var isCreator = function(layer, user) {
			if(layer.creator._id) {
				return user._id.toHexString() == layer.creator._id.toHexString();
			} else {
				return user._id.toHexString() == layer.creator;
			}
		}
		
		Layer.findById(req.body.layer, function(err, layer){
			if ((err) || (!layer)){
				return res.json(403, {
					messages: [{
						status: 'error',
						text: 'Erro ao carregar a camada.'
					}]
				});
			} else if (typeof isContributor(layer, req.user) == 'undefined' && !isCreator(layer, req.user)) {
				return res.json(403, {
					messages: [{
						status: 'error',
						text: 'Você não tem permissão para fazer isso.'
					}]
				});
			} else {
				next();
			}			
		})


	}
}


/**
 *  Layer authorization 
 **/

exports.layer = {
	requireOwnership: function (req, res, next) {
		if (req.layer.creator.id != req.user.id) {
			return res.json(403, { 
				messages: [{
					status: 'error',
					text: 'Layer ownership is needed.'
				}]
			});
		} else {
			next();
		}
	}
}