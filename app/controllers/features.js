
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'), 
	Feature = mongoose.model('Feature'),
	utils = require('../../lib/utils'),
	extend = require('util')._extend;
	
/**
 * Load
 */

exports.load = function(req, res, next, id){
	Feature.load(id, function (err, feature) {
		if (err) return next(err)
		if (!feature) return res.json(400, new Error('not found'));
		req.feature = feature
		next()
	})
}

/**
 * List
 */

exports.index = function(req, res){
	var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
	var perPage = (req.param('perPage') > 0 ? req.param('perPage') : 30);
	var options = {
		perPage: perPage,
		page: page
	}

	Feature.list(options, function(err, features) {
		if (err) return res.json(400, err);
		Feature.count().exec(function (err, count) {
			if (!err) {
				res.json({options: options, featuresTotal: count, features: features});
			} else {
				res.json(400, err)
			}
		})
	})
}


/**
 * Show
 */

exports.show = function(req, res){
	res.json(req.feature)
}

/**
 * New feature
 */

exports.new = function(req, res){
	res.json(new Feature({}))
}

/**
 * Create a feature
 */

exports.create = function (req, res) {
	var feature = new Feature(req.body);
	feature.creator = req.user;
	
	// save feature
	feature.save(function (err) {
		if (err) res.json(400, err);
		var layer = feature.layer;
		layer.features.push(feature);
		
		// save layer
		layer.save(function(err){
			if (err) res.json(400, err);
			res.json(feature);
		});
	});
}

/**
 * Update feature
 */

exports.update = function(req, res){
	var feature = req.feature
	feature = extend(feature, req.body)

	feature.save(function(err) {
		if (!err) {
			res.json(feature);
		} else {
			res.json(400, err)
		}
	})
}
