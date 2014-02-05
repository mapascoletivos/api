
/*
 * Module dependencies.
 */

var 
	async = require('async'),
	loremIpsum = require('lorem-ipsum'),
	app = require('../server'),
	Factory = require('factory-lady'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Feature = mongoose.model('Feature'),
	Content = mongoose.model('Content'),
	Layer = mongoose.model('Layer');

/*
 *  Lorem Ipsum settings
 */

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


/*
 * Maximum extents for random coordinates
 */

var
	y_min = -23.6815,
	y_max = -23.3765,
	x_min =-46.8188,
	x_max = -46.2736;


var randomCoordinatesPair = function(){
	var 
		x = (Math.random() *(x_min - x_max) + x_min).toFixed(4),
		y = (Math.random() *(y_min - y_max) + y_min).toFixed(4);
	return [y,x]; // [lat,lon]
}

/*
 * Set counter and maximun number of elements
 */

var 
	usersCounter = 0,
	featuresCounter = 0,
	layersCounter = 0,	
	usersMax = 10,
	layersMax = 10,
	featuresMax = 20;

/*
 * Object factories definition
 */

Factory.define('user', User, {	
	name: function(cb) { cb('user' + ++usersCounter); }, 
	email: function(cb) { cb('user' + usersCounter + '@example.com'); }, 
	password : '123456'
});

Factory.define('feature', Feature, {	
	title: function(done) { done( loremIpsum(loremIpsumCfg.title)); },
	description: function(done) { done( loremIpsum(loremIpsumCfg.description)); },
	geometry: function(done) { done({type: 'Point', coordinates: randomCoordinatesPair()}) }
});

Factory.define('layer', Layer, {	
	title: function(done) { done( loremIpsum(loremIpsumCfg.title) ); },
	description: function(done) { done( loremIpsum(loremIpsumCfg.description) ); },
});

Factory.define('content', Content, {
	type: 'Markdown',
	url: 'www.youtube.com/watch?v=4eGQ5VFt7P4‎',
	title: function(done) { done( loremIpsum(loremIpsumCfg.title) ); },
	markdown: function(done) { done( loremIpsum(loremIpsumCfg.description) ); },
});

/*
 * Helper functions
 */

var assignContentsForFeature = function(layer, feature, doneAssign) {
	
	var contentsArray = [];
	
	async.times(2, function(n,done){
		// create a content
		Factory.create('content', {creator: feature.creator, feature: feature, layer: layer}, function(content){
			done(null,content);
		});
	}, function(err,contents){
		// assign created features to feature
		feature.contents = contents
		feature.save(doneAssign);
	});
	
}

var assignFeaturesForLayer = function(layer, doneAssign) {
	
	var featuresArray = [];
	
	async.times(10, function(n,done){
		// create a feature
		Factory.create('feature', {creator: layer.creator, layer: layer}, function(feature){
			assignContentsForFeature(layer, feature, done);
			// done(null,feature);
		});
	}, function(err,features){
		// assign created features to layer
		layer.features = features
		layer.save(doneAssign);
	});
	
}

var createAUserAndLayers = function(id, doneUsersAndLayers) {
	Factory.create('user', function(user){
		async.times(10, function(n,done){
			Factory.create('layer', {creator: user}, function(layer){
				assignFeaturesForLayer(layer,done);
			});
		}, function(err,users){
			doneUsersAndLayers(null, users);
		});
	});
}

var populate = function() {
	async.times(10, createAUserAndLayers, function(err, users){
		process.exit(0);
	});
}

// Clear DB
async.parallel([
	// function (cb) {
	// 	User.collection.remove(cb)
	// },
	function (cb) {
		Feature.collection.remove(cb)
	},
	function (cb) {
		Layer.collection.remove(cb)
	},
	function (cb) {
		Content.collection.remove(cb)
	}
], populate)
