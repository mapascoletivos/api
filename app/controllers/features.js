
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'), 
	Feature = mongoose.model('Feature');
  
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
	feature.creator = req.user

	feature.save(function (err) {
		if (!err) {
			req.flash('success', 'Successfully created feature!')
			return res.redirect('/features/'+feature._id)
		}

		res.render('features/new', {
			title: 'New Feature',
			feature: feature,
			errors: utils.errors(err.errors || err)
		})
	})
}

/**
 * Show
 */

exports.show = function(req, res){
  res.render('features/show', {
    title: req.feature.title,
    feature: req.feature
  })
}