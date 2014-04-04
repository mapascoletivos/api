
/**
 * Module dependencies.
 */

var 
	_ = require('underscore'),
	mongoose = require('mongoose'), 
	Feature = mongoose.model('Feature'),
	extend = require('util')._extend,
	messages = require('../../lib/messages'),
	async = require('async');
	
/**
 * Load
 */

exports.load = function(req, res, next, id){
	Feature.load(id, function (err, feature) {
		if (err) {
			return next(err)
		} else if (!feature) {
			return res.json(400, {
				messages: [{
					status: 'error',
					message: 'Feature not found.'
				}]
			});
		} else {
			req.feature = feature;
			next();
		}
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
		if (err) return res.json(400, messages.errors(err));
		Feature.count().exec(function (err, count) {
			if (!err) {
				res.json({options: options, featuresTotal: count, features: features});
			} else {
				res.json(400, messages.errors(err))
			}
		})
	})
}

/**
 * Create a feature
 */

exports.create = function (req, res) {
	var feature = new Feature(req.body);
	feature.creator = req.user;
	feature.layer = req.layer;
	
	feature.markModified('geometry');
	
	// save feature
	feature.save(function (err) {
		if (err) {
			res.json(400, messages.errors(err));
		} else {
			var layer = feature.layer;
			layer.features.addToSet(feature);
			
			// save layer
			layer.save(function(err){
				if (err) res.json(400, messages.errors(err));
				res.json(feature);
			});
		}
	});
}


/**
 * Show
 */

exports.show = function(req, res){
	res.json(req.feature)
}

/**
 * Update feature
 */

exports.update = function(req, res){
	var 
		feature = req.feature;
	
	// Association to contents should be handled at Content Model.
	delete(req.body['contents']);
	delete(req.body['address']);

	// If geometry hasn't changed, don't update it at the model to 
	// avoid address lookup 
	if (_.isEqual(feature.geometry.coordinates, req.body.geometry.coordinates)) {
		delete req.body.geometry;
	}
	
	feature = extend(feature, req.body);

	feature.save(function(err) {
		if (err) res.json(400, messages.errors(err));
		else res.json(feature);
	});
}

/**
 * Add content to feature
 */

exports.addContent = function(req, res){
	var 
		feature = req.feature,
		content = req.content;

	// associate content to feature, if not already 
	if ( ! _.contains(feature.contents, content._id) ) { 
		feature.contents.push(content);
	}
	
	// associate feature to content, if not already 
	if ( ! _.contains(content.features, feature._id) ) { 
		content.features.push(feature);
	}

	// save both
	content.save(function(err){
		 if (err) res.json(400, messages.errors(err));
		feature.save(function(err){
			if (err) res.json(400,err)
			else res.json(messages.success('Content added successfully.'));
		});
	});

}

/**
 * Remove content from feature
 */

exports.removeContent = function(req, res){
	var 
		feature = req.feature,
		content = req.content;
	
	feature.contents = _.filter(feature.contents, function(c) { 
		return !c._id.equals(content._id); 
	});	
	
	content.features = _.filter(content.features, function(f) { 
		return !f._id.equals(feature._id); 
	});	
	
	// save both
	content.save(function(err){
		 if (err) res.json(400, utils.errorMessages(err.errors || err));
		feature.save(function(err){
			if (err) res.json(400,err)
			else res.json(messages.success('Content removed successfully.'));
		});
	});
}

/*
 * Import
 * (Batch create features)
 */

exports.import = function(req, res) {
	var layer = req.layer;
	async.eachSeries(req.body, function(feature, cb) {

		var feature = new Feature(feature);
		feature.creator = req.user;
		feature.layer = req.layer;

		// Set geometry as modified, otherwise it won't do address lookup
		feature.markModified('geometry');

		// save feature
		feature.save(function (err) {
			if (err) {
				cb(err);
			} else {
				layer.features.addToSet(feature);

				// Wait 0.2 seconds to process next feature to avoid nominatim overload 
				setTimeout(cb, 200);
			}
		});
	}, function(err) {
		if(err) res.json(400, messages.errors(err));
		else {			
			// save layer
			layer.save(function(err){
				if(err) {
					if(err) res.json(400, messages.errors(err));
				} else {
					res.json(layer.features);
				}
			});
		}
	});
}
