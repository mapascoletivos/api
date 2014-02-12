
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

	// console.log('Content POST\n'+req.body);

	// clear field from body that should be handled internally
	delete req.body['creator'];

	var 
		content = new Content(req.body)
		newFeaturesArray = req.body.features;
		
	// console.log('newFeaturesArray\n' + req.body.features);
	// console.log('sirTrevorData que chegou no create\n' + req.body.sirTrevorData);
	
	// associate content to user originating request
	content.creator = req.user;
	
	Layer.findById(req.body['layer'], function(err, layer){
		if (err) res.json(400, err);
		else {
			layer.contents.addToSet(content);
			layer.save(function(err){
				if (err) res.json(400, err);
				else {
					content.updateSirTrevor(req.body.sirTrevorData, function(err, ct){
						// console.log('content apos updateSirTrevorData\n'+ct);
						if (err) res.json(400, err);
						else
							ct.setFeatures(req.body.features, function(err,ct){
								if (err) res.json(400, err);
								else
									content.save(function(err){
										// console.log('salvou o content assim\n'+content);
										if (err) res.json(400, err);
										else res.json(content);
									});
							});
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
	
	// console.log('Content body no PUT\n'+req.body);
	
	var 
		content = req.content,
		updatedSirTrevor = req.body.sirTrevorData,
		updatedFeatures = req.body.features;
	
	// console.log('updatedSirTrevor no controller PUT\n'+updatedSirTrevor.length);

	console.log('o content no update\n'+content);

	delete req.body['creator'];
	delete req.body.layer;
	delete req.body.features;

	content = extend(content, req.body)

	// console.log('esse é o content\n'+content);

	content.updateSirTrevor(updatedSirTrevor, function(err, ct){
		// console.log('atualizou sirTrevor, ficou assim\n'+ ct);
		if (err) res.json(400, err);
		else
			ct.setFeatures(updatedFeatures, function(err, ct){
				// console.log('atualizou features, ficou assim\n'+ ct);
				if (err) res.json(400, err);
				else
					ct.save(function(err){
						// console.log('salvou isso\n'+ct);
						if (err) res.json(400, err);
						else res.json(ct);
					});
			});
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