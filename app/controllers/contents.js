
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

exports.load = function(req, res, next, id) {
	Content.load(id, function (err, content) {
		if (err) {
			return next(err)
		} else if (!content) {
			return res.json(400, {
				messages: [{
					status: 'error',
					message: 'Content not found.'
				}]
			});
		} else {
			req.content = content;
			next();
		}
	});
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

	if(req.param('userId')) {
		options.criteria = { creator: req.param('userId') };
	}

	if (req.param('search'))
		options.criteria = {
			$and: [
				options.criteria,
				{ title: { $regex: req.param('search'), $options: 'i' }}
			]
		}

	Content.list(options, function(err, contents) {
		if (err) return res.json(400, utils.errorMessages(err.errors || err));
		Content.count(options.criteria).exec(function (err, count) {
			if (err) res.json(400, utils.errorMessages(err.errors || err));
			else res.json({options: options, contentsTotal: count, contents: contents});
		})
	})
}

/**
 * Create a content
 */

exports.create = function (req, res) {

	// clear field from body that should be handled internally
	delete req.body['creator'];

	var 
		content = new Content(req.body)
		newFeaturesArray = req.body.features;
		
	// associate content to user originating request
	content.creator = req.user;
	
	Layer.findById(req.body['layer'], function(err, layer){
		if (err) res.json(400, utils.errorMessages(err.errors || err));
		else {
			layer.contents.addToSet(content);
			layer.save(function(err){
				if (err) res.json(400, utils.errorMessages(err.errors || err));
				else {
					content.updateSirTrevor(req.body.sirTrevorData, function(err, ct){
						if (err) res.json(400, utils.errorMessages(err.errors || err));
						else
							content.save(function(err){
								// console.log('salvou o content assim\n'+content);
								if (err) res.json(400, utils.errorMessages(err.errors || err));
								else res.json(content);
							});
					});
				}
			});
		}
	});
}

/**
 * Update content
 */

exports.update = function(req, res){
	
	var 
		content = req.content,
		updatedSirTrevor = req.body.sirTrevorData,
		updatedFeatures = req.body.features;
	
	delete req.body['creator'];
	delete req.body.layer;

	content = extend(content, req.body)

	content.updateSirTrevor(updatedSirTrevor, function(err, ct){
		if (err) res.json(400, utils.errorMessages(err.errors || err));
		else
			ct.save(function(err){
				if (err) res.json(400, utils.errorMessages(err.errors || err));
				else res.json(ct);
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
 * Destroy content
 */

exports.destroy = function(req, res){
	var 
		content = req.content;

	mongoose.model('Layer').findById(content.layer._id, function(err, layer){
		if (err) res.json(400, utils.errorMessages(err.errors || err));
		else {

			layer.contents.pull({_id: content._id});

			layer.save(function(err){
				if (err) res.json(400, utils.errorMessages(err.errors || err));
				else {
					content.remove(function(err){
						if (err) res.json(400, utils.errorMessages(err.errors || err));
						else res.json({messages: [{status: 'ok', text: 'Content removed successfully.'}]});
					})
				}
			})
		}
	})
}