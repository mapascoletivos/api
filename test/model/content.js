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
	Factory = require('../../lib/factory'),
	imageFile = 'fixtures/ecolab.png';


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



	describe('.setFeatures()', function(){
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
			content.setFeatures([feature1._id, feature2._id], function(err, ct){
				should.not.exist(err);
				ct.save(function(err){
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
				})
			});
		});
	});


	describe('when removing a Content', function(){
		var 
			user1,
			layer1,
			content,
			feature1,
			feature2,
			image1,
			image2;

		// Create a content with features 
		before( function (doneBefore) {
			
			async.parallel([
				function(callback){
					Factory.create('User', function(usr){
						user1 = usr;
						callback();
					});
				},
				function(callback){
					Factory.create('Layer', function(lyr){
						layer1 = lyr;
						callback();
					});
				},
				function(callback){
					Factory.create('Feature', {creator: user}, function(ft1){
						feature1 = ft1;
						callback();
					});
				},
				function(callback){
					Factory.create('Feature', {creator: user}, function(ft2){
						feature2 = ft2;
						callback();
					});
				},
				function(callback){
					Factory.create('Image', {sourcefile: imageFile}, function(img1){
						image1 = img1;
						img1.uploadImageAndSave(imageFile, 'url', callback);
					})
				},
				function(callback){
					Factory.create('Image', {sourcefile: imageFile}, function(img2){
						image2 = img2;
						img2.uploadImageAndSave(imageFile, 'url', callback);
					})
				}
			], function(){
				Factory.build('Content', {creator: user1, layer: layer1}, function(cnt){
					content = cnt;
					
					// add images
					content.updateSirTrevor([{
						data: image1,
						type: "image"
					},{
						data: image2,
						type: "image"
					}], function(ct){
						
						// add features
						ct.setFeatures([feature1, feature2], function(err, newCt){
							should.not.exist(err);
							newCt.features.length.should.eql(2);
							newCt.features.should.include(feature1._id);
							newCt.features.should.include(feature2._id);
							content = newCt;
							content.save(doneBefore);
						});
					});
				})
			});
		});

		it('should remove images and references in features', function(done){
			
			// images should exist before content removal
			async.parallel([
				function(callback){
					Image.findById(image1._id, function(err, img1){
						should.not.exist(err);
						should.exist(img1);
						callback();
					});
				},				
				function(callback){
					Image.findById(image2._id, function(err, img2){
						should.not.exist(err);
						should.exist(img2);
						callback();
					});
				}
			], function(){
				Content.findById(content._id, function(err, ctt){
					
					should.not.exist(err);
					
					ctt.remove(function(err){
						
						should.not.exist(err);
						
						async.parallel([
							function(callback){
								Feature.findById(feature1._id, function(err, ft1){
									ft1.contents.should.not.include(content._id);
									callback();
								});
							},
							function(callback){
								Feature.findById(feature2._id, function(err, ft2){
									ft2.contents.should.not.include(content._id);
									callback();
								});
							},
							function(callback){
								Image.findById(image1._id, function(err, img1){
									should.not.exist(err);
									should.not.exist(img1);
									callback();
								});
							},
							function(callback){
								Image.findById(image2._id, function(err, img2){
									should.not.exist(err);
									should.not.exist(img2);
									callback();
								});
							}
						], done);
					});
				});
			});
		});
	})
});