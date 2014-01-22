
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'), 
	Content = mongoose.model('Content'),
	utils = require('../../lib/utils'),
	extend = require('util')._extend;

/**
 * Load
 */

exports.load = function(req, res, next, id){
	Content.load(id, function (err, content) {
		if (err) return next(err)
			if (!content) return res.json(400, new Error('not found'));
			req.content = content;
			next()
		})
}

/**
 * Show
 */

exports.show = function(req, res){
	return res.json(req.content);
}

/**
 * Update content
 */

exports.update = function(req, res){
	var 
		content = req.content;

	content = extend(content, req.body)

	content.save(function(err) {
		if (err) res.json(400, err);
		res.json(content);
	});
}

/**
 * Create a content
 */

exports.create = function (req, res) {
	var 
		content = new Content(req.body),
		feature = req.feature,
		layer = feature.layer;

	// associate content, feature and layer
	content.creator = req.user;
	content.features.push(feature);
	content.layer = layer;
	feature.contents.push(content);
	layer.contents.push(content);
	
	// save all
	content.save(function (err) {
		if (err) res.json(400, err);
		feature.save(function (err) {
			if (err) res.json(400, err);
			layer.save(function(err){
				if (err) res.json(400, err);
				res.json(content);
			});
		});
	});
}

exports.remove = function(req, res){
	var 
		content = req.content,
		feature = req.feature,
		layer = feature.layer;

	// remove from a belonging feaure and layer
	feature.contents = _.filter(feature.contents, function(c) { return !c.equals(content._id); });
	layer.contents = _.filter(layer.contents, function(c) { return !c._id.equals(content._id); });

	// save task
	var saveFeatureAndLayer = function(err) {
		if (err) res.json(400, err);
		feature.save(function(err) {
			if (err) res.json(400,err);
			layer.save(function(err){
				if (err) res.json(400,err);
				res.json({success: true});
			})
		})
	}	

	// if it belongs to only one feature, destroy it
	if (content.features.length === 1) { 
		content.remove(saveFeatureAndLayer); 
	} else {
		content.save(saveFeatureAndLayer); 
	}
}