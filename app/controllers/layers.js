
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'), 
	Layer = mongoose.model('Layer'),
	utils = require('../../lib/utils'),
	extend = require('util')._extend;
  
/**
 * Load
 */

exports.load = function(req, res, next, id){
	Layer.load(id, function (err, layer) {
		if (err) return next(err)
		if (!layer) return next(new Error('not found'))
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
    page: page
  }

  Layer.list(options, function(err, layers) {
    if (err) return res.render('500')
    Layer.count().exec(function (err, count) {
      res.json(layers); 
    })
  })
}

/**
 * Show
 */

exports.show = function(req, res){
  res.json(req.layer); 
}

/**
 * New layer
 */

exports.new = function(req, res){
  res.render('layers/new', {
    title: 'New layer'
  })
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
  console.log(req);
  var layer = req.layer
  layer = extend(layer, req.body)

  layer.save(function(err) {
    if (!err) {
      res.json(layer)
    } else {
      res.json(400, false)
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