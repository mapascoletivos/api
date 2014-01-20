
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'), 
	Feature = mongoose.model('Feature'),
	utils = require('../../lib/utils'),
	extend = require('util')._extend;
  
/**
 * Load
 */

exports.load = function(req, res, next, id){
	Feature.load(id, function (err, feature) {
		if (err) return next(err)
			if (!feature) return next(new Error('not found'))
			req.feature = feature
			next()
		})
}

/**
 * List
 */

exports.index = function(req, res){
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
  var perPage = 30
  var options = {
    perPage: perPage,
    page: page
  }

  Feature.list(options, function(err, features) {
    if (err) return res.render('500')
    Feature.count().exec(function (err, count) {

      if (req.params.format == "json") { 
        res.json(features); 
      } else {
        res.render('features/index', {
          title: 'Features',
          features: features,
          page: page + 1,
          pages: Math.ceil(count / perPage)
        })
      }
    })
  })
}

/**
 * New feature
 */

exports.new = function(req, res){
  res.render('features/new', {
    title: 'New Feature',
    feature: new Feature({})
  })
}

/**
 * Create a feature
 */

exports.create = function (req, res) {
	var feature = new Feature(req.body);
	feature.creator = req.user;
	
	feature.save(function (err) {
		if (!err) {
      res.send(feature.id);
		} else {
      res.send(400, 'Bad request')
    }
	})
}

/**
 * Update article
 */

exports.update = function(req, res){
  var feature = req.feature
  feature = extend(feature, req.body)

  feature.save(function(err) {
    if (!err) {
      return res.redirect('/features/' + feature._id)
    }

    res.render('features/edit', {
      title: 'Edit Article',
      feature: feature,
      errors: err.errors
    })
  })
}

/**
 * Edit an feature
 */

exports.edit = function (req, res) {
  res.render('features/edit', {
    title: 'Edit ' + req.feature.title,
    feature: req.feature
  })
}

/**
 * Show
 */

exports.show = function(req, res){
  if (req.params.format == "json") { 
    res.json(req.feature); 
  } else {
    res.render('features/show', {
      title: req.feature.title,
      feature: req.feature
    })
  }
}

exports.showJSON = function(req, res){
  res.json(req.feature);
}

/**
 * Delete an article
 */

exports.destroy = function(req, res){
  var feature = req.feature
  feature.remove(function(err){
    req.flash('info', 'Deleted successfully')
    res.redirect('/features')
  })
}