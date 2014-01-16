
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'), 
	Layer = mongoose.model('Feature'),
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
 * New layer
 */

exports.new = function(req, res){
  res.render('layers/new', {
    title: 'New layer'
  })
}