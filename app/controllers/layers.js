
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'), 
	Layer = mongoose.model('Layer'),
	Feature = mongoose.model('Feature'),
	utils = require('../../lib/utils'),
	extend = require('util')._extend,
	_ = require('underscore');
	
/**
 * Load
 */

exports.load = function(req, res, next, id){
	Layer.load(id, function (err, layer) {
		if (err) return res.json(400, new Error('not found'));
		if (!layer) res.json(400, new Error('not found'));
		req.layer = layer
		next()
	})
}

/**
 * List
 */

exports.index = function(req, res){
	var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
	var perPage = (req.param('perPage') > 0 ? req.param('perPage') : 30);
	var options = {
		perPage: perPage,
		page: page,
		criteria: {
			$or: [ {creator: req.user} , {visibility: 'Visible'} ]
		}
	}
	
	if(req.param('creatorOnly'))
		options.criteria = { creator: req.user }

	if(req.param('userId')) {
		if(!req.user || req.user._id != req.param('userId'))
			options.criteria = { $and: [ {creator: req.param('userId')}, {visibility: 'Visible'} ] };
		else
			options.criteria = { creator: req.param('userId') };
	}

	if (req.param('search'))
		options.criteria = {
			$and: [
				options.criteria,
				{ title: { $regex: req.param('search'), $options: 'i' }}
			]
		}

	Layer.list(options, function(err, layers) {
		if (err) return res.json(400, err);
		Layer.count(options.criteria).exec(function (err, count) {
			if (!err) {
				res.json({options: options, layersTotal: count, layers: layers});
			} else {
				res.json(400, err)
			} 
		});
	});
}

/**
 * Show
 */

exports.show = function(req, res){
	res.json(req.layer);
}

/**
 * Create a layer
 */

exports.create = function (req, res) {
	var layer = new Layer(req.body);
	layer.creator = req.user;
	
	layer.save(function (err) {
		if (!err) {
			res.json(layer);
		} else {
			res.json(400, err)
		}
	})
}

/**
 * Update layer
 */

exports.update = function(req, res){
	var layer = req.layer;

	delete req.body['features'];
	delete req.body['contents'];
	delete req.body['__v'];

	layer = extend(layer, req.body);

	layer.save(function(err) {
		if (!err) {
			res.json(layer)
		} else {
			res.json(400, err)
		}
	})
}

/**
 * Delete layer
 */

exports.destroy = function(req, res){
	var layer = req.layer
	layer.remove(function(err){
		if(err) {
			res.json(400, err);
		} else {
			res.json({success: true});
		}
	})
}

/**
 * Add a feature in layer
 */

exports.addFeature = function (req, res) {
	var 
		feature = req.feature,
		layer = req.layer;

	// associate feature to layer, if not already 
	if ( ! _.contains(feature.layers, layer._id) ) { 
		feature.layers.push(layer);
	}

	// associate layer to feature, if not already 
	if ( ! _.contains(layer.features, feature._id) ) { 
		layer.features.push(feature);
	}

	feature.save(function(err){
		 if (err) res.json(400, err);
		layer.save(function(err){
			if (err) res.json(400,err)
			else res.json(feature);
		})
	})
}

/**
 * Remove feature from layer
 */

exports.removeFeature = function (req, res) {
	var 
		feature = req.feature,
		layer = req.layer;

	var saveLayer = function(err) {
		if (err) res.json(400, err);
		layer.features = _.filter(layer.features, function(f) { return !f._id.equals(feature._id); });
		layer.save(function(err) {
			if (err) res.json(400,err);
			else res.json(feature);
		})
	}

	// if feature belongs to only one layer, destroy it
	if(feature.layers.length === 1) {
		feature.remove(saveLayer);
	} else {
		feature.layers = _.filter(feature.layers, function(l) { return !l.equals(layer._id); });
		feature.save(saveLayer);
	}

}


/**
 * Add a contributor to layer
 */

exports.addContributor = function (req, res) {
	var 
		contributorEmail = req.body.email,
		layer = req.layer;

	User.findOne({email: contributorEmail}, function(err, user){
		if (err) {
			res.json(400, { messages: utils.errors(err.errors || err) })
		} else if (!user) {
			res.json(400, { messages: [{type:'error', message: 'User unknown'}] })
		} else {
			layer.contributors.addToSet(user);
			layer.save(function(err){
				res.json({ layer: layer, messages: [{type:'info', message: 'Contributor added successfully'}] })
			})
		}
	})
}

/**
 * Remove feature from layer
 */

exports.removeContributor = function (req, res) {
	var 
		contributorId = req.body.contributorId,
		layer = req.layer;

	Layer.update({_id: layer._id}, {$pull: {contributors: {id: contributorId}}}, function(err){
		if (err) {
			res.json(400, { messages: utils.errors(err.errors || err) })
		} else {
			res.json({ layer: layer, messages: [{type:'info', message: 'Contributor removed successfully'}] })
		}
	});
}