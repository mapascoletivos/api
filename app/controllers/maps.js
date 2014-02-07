
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
 * Create a map
 */

exports.create = function (req, res) {
	var map = new Map(req.body);
	
	map.creator = req.user;

	// save map
	map.save(function (err) {
		if (err) res.json(400, err);
		res.json(map);
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

	Map.list(options, function(err, maps) {
		if (err) return res.json(400, err);
		Map.count().exec(function (err, count) {
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
 * Update map
 */

exports.update = function(req, res){
	var 
		map = req.map;

	// can't change map creator
	delete(req.body['creator']);

	map = extend(map, req.body);

	map.save(function(err) {
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