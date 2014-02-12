
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
	var 
		content = req.content,
		newFeaturesArray = req.body.features;

	delete req.body.features;

	content = extend(content, req.body)
	// console.log('alô')
	content.updateSirTrevor(req.body.sirTrevorData, function(err, ct){
		// console.log('atualizou sirTrevor');
		if (err) res.json(400, err);
		else
			ct.setFeatures(req.body.features, function(err, ct){
				// console.log('atualizou features');	
				if (err) res.json(400, err);
				else
					content.save(function(err){
						// console.log('vai salvar');
						if (err) res.json(400, err);
						else res.json(content);
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