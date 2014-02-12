
/**
 * Module dependencies.
 **/

var 
	// async = require('async'),
	loremIpsum = require('lorem-ipsum'),
	// app = require('../server'),
	Factory = require('factory-lady'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Feature = mongoose.model('Feature'),
	Content = mongoose.model('Content'),
	Image = mongoose.model('Image'),
	Layer = mongoose.model('Layer');

/**
 *  Lorem Ipsum settings
 **/

var
	loremIpsumCfg = {
		title: {
			units: 'sentences', 			
			count: 1,
			sentenceLowerBound: 5,
			sentenceUpperBound: 10,			 
			format: 'plain'
		},
		description: {
			units: 'paragraphs',
			count: 1,
			sentenceLowerBound: 5,
			sentenceUpperBound: 15,
			format: 'plain'
		}
	};


/**
 * Maximum extents for random coordinates
 **/

var
	y_min = -23.6815,
	y_max = -23.3765,
	x_min =-46.8188,
	x_max = -46.2736;

/**
 * Counters
 **/

var 
	usersCounter = 0,
	featuresCounter = 0,
	layersCounter = 0,
	imagesCounter = 0;

/**
 * Helper functions
 **/

var randomCoordinatesPair = function(){
	var 
		x = (Math.random() *(x_min - x_max) + x_min).toFixed(4),
		y = (Math.random() *(y_min - y_max) + y_min).toFixed(4);
	return [y,x]; // [lat,lon]
}

/*
 * The factories
 */

Factory.define('User', User, {	
	name: function(cb) { cb('user' + ++usersCounter); }, 
	email: function(cb) { cb('user' + usersCounter + '@example.com'); }, 
	password : '123456'
});

Factory.define('Feature', Feature, {	
	title: function(done) { done( loremIpsum(loremIpsumCfg.title)); },
	description: function(done) { done( loremIpsum(loremIpsumCfg.description)); },
	geometry: function(done) { done({type: 'Point', coordinates: randomCoordinatesPair()}) }
});

Factory.define('Layer', Layer, {	
	title: function(done) { done( loremIpsum(loremIpsumCfg.title) ); },
	description: function(done) { done( loremIpsum(loremIpsumCfg.description) ); },
});

Factory.define('Content', Content, {
	type: 'Markdown',
	url: 'www.youtube.com/watch?v=4eGQ5VFt7P4‎',
	title: function(done) { done( loremIpsum(loremIpsumCfg.title) ); },
	markdown: function(done) { done( loremIpsum(loremIpsumCfg.description) ); },
});

Factory.define('Image', Image, {
	file: {
		name: 'image' + imagesCounter +'.jpg',
		url: 'http://localhost:3000/uploads/images/image' + imagesCounter++ +'.jpg'
	}
});

module.exports = Factory