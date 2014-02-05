/*
 * Module dependencies.
 */

var 
	async = require('async'),
	_ = require('underscore'),
	request = require('supertest'),
	should = require('should'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	Layer = mongoose.model('Layer'),
	Feature = mongoose.model('Feature'),
	Content = mongoose.model('Content'),
	User = mongoose.model('User'),
	Factory = require('../../lib/factory');

var
	user1,
	user1Layer1,
	user1Content,
	user1Feature1,
	user1Feature2;

describe('Content Model', function(){

	// Create a content with features 
	before( function (doneBefore) {

		async.series([
			function(done){
				Factory.create('User', function(usr){
					user1 = usr;
					done(null);
				});
			}, 
			function(done){
				Factory.create('Layer', function(lyr){
					user1Layer1 = lyr;
					done(null);
				});
			},
			function(done){
				Factory.create('Feature', {creator: user1._id, layers: [user1Layer1._id]}, function(ft1){	
					user1Feature1 = ft1;
					done(null);
				});
			},
			function(done){
				Factory.create('Feature', {creator: user1._id, layers: [user1Layer1._id]}, function(ft2){	
					user1Feature2 = ft2;
					done(null);
				});
			},
			function(done){
				Factory.create('Content', {
					creator: user1._id, 
					layer: user1Layer1._id, 
					features: [user1Feature1 , user1Feature2]
				}, function(ct1){	
					user1Content = ct1;

					done(null);
				});
			}], 
			function (err) {
				doneBefore(err);
		});
	});

	describe('.remove()', function(){
		var
			feature1,
			feature2,
			content;

		before(function(done){
			Factory.create('Feature', {creator: user1._id, layers: [user1Layer1._id]}, function(ft1){
				feature1 = ft1;
				Factory.create('Feature', {creator: user1._id, layers: [user1Layer1._id]}, function(ft2){
					feature2 = ft2;
					Factory.create('Content', {creator: user1._id, layer: [user1Layer1._id], features:[feature1, feature2]}, function(ct1){
						content = ct1;
						content.updateFeaturesAssociationAndSave([feature1._id, feature2._id], done);
					});
				});
			});
		});

		it('should remove the feature from associated contents', function(done){
			var feature1Id = feature1._id;
			Feature.findById(feature1._id, function(err, feature){
				feature.remove(function(err){
					should.not.exist(err);
					Content.findById(content._id, function(err, ct){
						should.not.exist(err);
						ct.features.should.not.include(feature1Id);
						done();
					});
				});
			});
		});
	});
});