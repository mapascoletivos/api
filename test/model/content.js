/*
 * Module dependencies.
 */

var 
	async = require('async'),
	_ = require('underscore'),
	request = require('supertest'),
	should = require('should'),
	app = require('../../web'),
	mongoose = require('mongoose'),
	Layer = mongoose.model('Layer'),
	Feature = mongoose.model('Feature'),
	Content = mongoose.model('Content'),
	User = mongoose.model('User'),
	Factory = require('../../lib/factory');


describe('Content Model', function(){


	var
		user,
		layer;

	// Create a content with features 
	before( function (doneBefore) {

		async.series([
			function(done){
				Factory.create('User', function(usr){
					user = usr;
					done(null);
				});
			}, 
			function(done){
				Factory.create('Layer', function(lyr){
					layer = lyr;
					done(null);
				})
		}], doneBefore);

	});



	describe('.setFeaturesAndSave()', function(){
		var
			feature1,
			feature2,
			content;

		before(function(done){
			Factory.create('Feature', {creator: user._id, layers: [layer._id]}, function(ft1){
				feature1 = ft1;
				Factory.create('Feature', {creator: user._id, layers: [layer._id]}, function(ft2){
					feature2 = ft2;
					Factory.create('Content', {creator: user._id, layer: [layer._id]}, function(ct1){
						content = ct1;
						done();
					});
				});
			});
		});

		it('should set association in both sides', function(done){
			content.setFeaturesAndSave([feature1._id, feature2._id], function(err){
				should.not.exist(err);
				Content.findById(content._id, function(err, ct){
					should.not.exist(err);
					ct.features.should.include(feature1._id);
					ct.features.should.include(feature2._id);
					Feature.findById(feature1._id, function(err, ft1){
						should.not.exist(err);
						ft1.contents.should.include(content._id);
						Feature.findById(feature2._id, function(err, ft2){
							should.not.exist(err);
							ft2.contents.should.include(content._id);
							done();
						});
					});
				});
			});
		});
	});


	describe('when removing a Content', function(){
		var 
			content,
			feature1,
			feature2,
			image1,
			image2;

		// Create a content with features 
		before( function (done) {
			Factory.create('Feature', {creator: user}, function(ft1){
				feature1 = ft1;
				Factory.create('Feature', {creator: user}, function(ft2){
					feature2 = ft2;
					Factory.build('Content', {creator: user, layer: layer}, function(cnt){
						content = cnt;
						content.setFeaturesAndSave([ft1, ft2], function(err){
							should.not.exist(err);
							content.features.length.should.eql(2);
							content.features.should.include(feature1._id);
							content.features.should.include(feature2._id);
							done();
						})
					})
				})
			})
		});

		it('should remove references at features', function(){
			content.remove(function(err){
				should.not.exist(err);
				Feature.findById(feature1._id, function(err, ft1){
					ft1.contents.should.not.include(content._id);
					Feature.findById(feature2._id, function(err, ft2){
						ft2.contents.should.not.include(content._id);
					});
				});
			});
		});
	})
});