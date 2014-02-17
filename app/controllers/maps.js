
/**
 * Module dependencies.
 */

var 
	_ = require('underscore'),
	mongoose = require('mongoose'), 
	Map = mongoose.model('Map'),
	extend = require('util')._extend;

/**
 * Load
 */

exports.load = function(req, res, next, id){
	Map.load(id, function (err, map) {
		if (err) return next(err)
		if (!map) return res.json(400, new Error('not found'));
		req.map = map
		next()
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

	if(req.param('creatorOnly'))
		options.criteria = { creator: req.user }

	if(req.param('userId')) {
		if(!req.user || req.user._id != req.param('userId'))
			options.criteria = { $and: [ {creator: req.param('userId')}, {visibility: 'Visible'} ] };
		else
			options.criteria = { creator: req.param('userId') };
	}

	Map.list(options, function(err, maps) {
		if (err) return res.json(400, err);
		Map.count(options.criteria).exec(function (err, count) {
			if (err) res.json(400, err);
			res.json({options: options, mapsTotal: count, maps: maps});
		})
	})
}


/**
 * Show
 */

exports.show = function(req, res){
	res.json(req.map)
}

/**
 * Create a map
 */

exports.create = function (req, res) {
	var 
		map = new Map(req.body);
	
	map.creator = req.user;

	// save map
	map.setLayersAndSave(req.body.layers, function (err) {
		if (err) res.json(400, err);
		else res.json(map);
	});
}

/**
 * Update map
 */

exports.update = function(req, res){
	var 
		map = req.map,
		newLayerSet = req.body.layers;

	// can't change map creator
	delete(req.body['creator']);

	// delete from body to keep it in the map model for updating relationships properly
	delete(req.body['layers']);

	map = extend(map, req.body);

	map.setLayersAndSave(newLayerSet, function(err) {
		if (err) res.json(400, err);
		else res.json(map);
	})
}

/**
 * Delete map
 */

exports.destroy = function(req, res){
	var map = req.map
	map.remove(function(err){
		if (err) res.json(400, err);
		else res.json({success: true});
	});
}