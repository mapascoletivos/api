
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
			req.content = content
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

	Content.list(options, function(err, content) {
		if (err) return res.json(400, err);
		Content.count().exec(function (err, count) {
			if (!err) {
				res.json({options: options, contentTotal: count, content: content});
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
	return res.json(req.content)
}

/**
 * New content
 */

exports.new = function(req, res){
	res.json(new Content({}))
}

/**
 * Create a content
 */

exports.create = function (req, res) {
	var content = new Content(req.body);
	content.creator = req.user;
	content.layer = req.feature;
	
	content.save(function (err) {
		if (!err) {
			res.json(content);
		} else {
			res.json(400, err)
		}
	})
}

/**
 * Update content
 */

exports.update = function(req, res){
	var content = req.content
	content = extend(content, req.body)

	content.save(function(err) {
		if (!err) {
			res.json(content);
		} else {
			res.json(400, err)
		}
	})
}

/**
 * Delete an content
 */

exports.destroy = function(req, res){
	var content = req.content
	content.remove(function(err){
		if (err) {
			res.json(400, err);
		} else {
			res.json({success: true});
		}
	});
}