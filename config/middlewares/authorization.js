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
	canEdit: function (req, res, next) {

		var hasContributor = function(layer, user) {
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
				return user._id == layer.creator._id;
			} else {
				return user._id == layer.creator;
			}
		}

		var checkPermission = function() {
			if (typeof hasContributor(req.layer, req.user) == 'undefined' && !isCreator(req.layer, req.user)) {
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

		if(req.method == 'PUT' || req.method == 'DELETE')
			Layer.findById(req.query.layerId, function(err, layer) {
				req.layer = layer;
				console.log(req.layer);
				checkPermission();
			});
		else
			checkPermission();

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