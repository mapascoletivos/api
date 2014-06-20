/**
 * Module dependencies.
 */

var 
	async = require('async'),
	mongoose = require('mongoose'),
	moment = require('moment'),
	Area = mongoose.model('Area'),
	Feature = mongoose.model('Feature');

function Geocoder(options){
	
	options = options || {};

	function next(){
		findFeatures(function(){
			setTimeout(next, options.timeout || 5 * 60 * 1000) // wait to check for non-geocoded features again 
		})
	}

	// start updating
	next();
}

/*
 * Find features in need of geocoding. 
 */
function findFeatures(callback){
	Feature
		.find({$or: [
				{'address.0': {$exists: false}}, // doesn't have address
				{updatedAt: { $lt: moment().subtract(1, 'months').toDate() }} // geocode is old
		]})
		.select('id')
		.limit(100)
		.exec(function(err, features){
			if (err || !features) callback();
			else 
				async.eachSeries(features, function(feature, done){
					geocode(feature, function(){
						setTimeout(done, 200) // wait in milisecs to next geocode
					});
				}, callback)
		});

}

/*
 * Geocode and save feature. 
 */
function geocode(feature, callback) {

	// load feature
	Feature.findById(feature.id, function(err, f){
		if (err) {
			console.log('Error loading feature to geocode.');
			console.log(err);
			callback(err)
		} else {
			Area.whichContains(f.geometry, function(err, areas){
				if (err) {
					console.log(areas);
					console.log('Error in geocoding:');
					console.log(err);
					callback(err);
				} else {
					f.address = areas;
					f.save(function(err){
						if (err) {
							console.log('There was an error saving a feature after geocoding');
							console.log(err);
							callback(err);
						} else callback();
					});					
				}
		 	}) ;
		}
	});
}

module.exports = Geocoder;