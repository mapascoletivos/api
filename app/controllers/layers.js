
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

      if (req.params.format == "json") { 
        res.json(layers); 
      } else {
        res.render('layers/index', {
          title: 'layers',
          layers: layers,
          page: page + 1,
          pages: Math.ceil(count / perPage)
        })
      }
    })
  })
}

/**
 * Show
 */

exports.show = function(req, res){
  if (req.params.format == "json") { 
    res.json(req.layer); 
  } else {
    res.render('layers/show', {
      title: req.layer.title,
      layer: req.layer
    })
  }
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
 * Templates
 */

exports.templates = {
	index: function(req, res) {
		res.render('layers');
	},
	show: function(req, res) {
		res.render('layers/show');
	}
}