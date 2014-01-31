
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'), 
	Content = mongoose.model('Content'),
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
		content = new Content(req.body),
		layer = req.layer;

	// associate content, feature and layer
	content.creator = req.user;
	content.layer = layer;
	
	// save all
	content.save(function (err) {
		if (err) res.json(400, err);
		layer.contents.push(content);
		layer.save(function(err){
			if (err) res.json(400, err);
			res.json(content);
		});
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
		content = req.content;

	content = extend(content, req.body)

	content.save(function(err) {
		if (err) res.json(400, err);
		res.json(content);
	});
}

/**
 * Destroy content
 */

exports.destroy = function(req, res){
	var 
		content = req.content,
		layer = content.layer;

	// TODO Remove from features

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