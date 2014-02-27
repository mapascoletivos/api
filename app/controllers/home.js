
/*!
 * Module dependencies.
 */

var mongoose = require('mongoose'), 
	Feature = mongoose.model('Feature');

/**
 * Home
 */

exports.index = function (req, res) {
	if(req.isAuthenticated()) {
		res.render('layouts/default', {
			title: 'Mapas Coletivos',
			user: req.user ? JSON.stringify(req.user) : 'null'
		})	
	} else {
		res.render('home/landing', {
			title: 'Mapas Coletivos'
		})
	}
}

exports.about = function(req, res) {
	res.render('home/about');
}

exports.terms = function(req, res) {
	res.render('home/terms');
}

exports.app = function(req, res) {
	res.render('layouts/default', {
		title: 'Mapas Coletivos'
	});
}

/**
 * Explore
 */

exports.explore = function (req, res) {
	var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
	var perPage = 30
	var options = {
		perPage: perPage,
		page: page
	}

	Feature.list(options, function(err, features) {
		if (err) return res.render('500')
		Feature.count().exec(function (err, count) {
			res.render('home/explore', {
				title: 'Features',
				features: features,
				page: page + 1,
				pages: Math.ceil(count / perPage)
			})
		})
	})
}
