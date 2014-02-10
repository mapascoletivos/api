
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'), 
	Content = mongoose.model('Content'),
	Layer = mongoose.model('Layer'),
	utils = require('../../lib/utils'),
	extend = require('util')._extend,
	_ = require('underscore');

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
 * Create a content
 */

exports.create = function (req, res) {
	
	var 
		newFeaturesArray = req.body.features;

	// clear fields from body that should be handled internally
	delete req.body['_id'];
	delete req.body['id'];	
	delete req.body['creator'];
	delete req.body['features'];

	var 
		content = new Content(req.body);

	// associate content to user originating request
	content.creator = req.user;
	
	Layer.findById(req.body['layer'], function(err, layer){
		if (err) res.json(400, err);
		else {
			layer.contents.addToSet(content);
			layer.save(function(err){
				if (err) res.json(400, err);
				else {
					content.setFeaturesAndSave(newFeaturesArray, function(err){
						if (err) res.json(400, err);
						else res.json(content);
					});
				}
			});
		}
	});
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
		content = req.content,
		newFeaturesArray = req.body.features;

	delete req.body.features;

	content = extend(content, req.body)

	content.setFeaturesAndSave(newFeaturesArray, function(err){
		if (err) res.json(400, err);
		else res.json(content);		
	});
}

/**
 * Destroy content
 */

exports.destroy = function(req, res){
	var 
		content = req.content,
		layer = content.layer;

	// remove content from belonging layer and feaures
	layer.contents = _.filter(layer.contents, function(c) { 
		return !c.equals(content._id); 
	});

	content.remove(function(err) {
		if (err) res.json(400,err);
		layer.save(function(err){
			if (err) res.json(400,err);
			res.json({success: true});
		});
	});
}