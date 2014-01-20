
/*
 * Module dependencies.
 */

var 
	async = require('async'),
	app = require('../server'),
	Factory = require('factory-lady'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Feature = mongoose.model('Feature'),
	Layer = mongoose.model('Layer');

/*
 * Maximum extents for random coordinates
 */

var
	x_min = -23.7283,
	x_max = -23.4369,
	y_min = -46.8122,
	y_max = -46.8122;  

var randomCoordinatesPair = function(){
	var 
		x = (Math.random() *(x_min - x_max) + x_min).toFixed(4),
		y = (Math.random() *(y_min - y_max) + y_min).toFixed(4);
	return [x,y];
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
	title: function(done) { done('Feature ' + ++featuresCounter ); },
	geometry: function(done) { done({type: 'Point', coordinates: randomCoordinatesPair()}) }
});

Factory.define('layer', Layer, {	
	title: function(done) { done('Layer ' + ++layersCounter ); }
});

/*
 * Helper functions
 */

var assignFeaturesForLayer = function(layer, doneAssign) {
	
	var featuresArray = [];
	
	async.times(10, function(n,done){
		// create a feature
		Factory.create('feature', {creator: layer.creator, layer: layer}, function(feature){
			// featuresArray.push(feature);
			done(null,feature);
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
	function (cb) {
		User.collection.remove(cb)
	},
	function (cb) {
		Feature.collection.remove(cb)
	},
	function (cb) {
		Layer.collection.remove(cb)
	}
], populate)
