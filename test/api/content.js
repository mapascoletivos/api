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
	
var
	apiPrefix = '/api/v1',
	imageFile = 'fixtures/ecolab.png';


describe('Content', function(){

	var 
		loggedAgent = request.agent(app),
		user1,
		layer1;

	before(function(done){
		Factory.create('User', function(usr){
			Factory.create('Layer', function(lyr){
				user1 = usr;
				layer1 = lyr;
				return loginUser(loggedAgent,user1)(done);
			});
		});
	})

	/**
	 * Create Content
	 */
	describe('POST /contents', function(){
		context('not logged in', function(){
			it('should redirect to /login', function (done) {
				request(app)
					.post(apiPrefix + '/contents')
					.expect('Content-Type', /plain/)
					.expect(302)
					.expect('Location', '/login')
					.expect(/Moved Temporarily/)
					.end(done)
			});
		});
	
		context('logged in', function(){
			
			describe('without features or images', function(){
				var
					content;

				// Create a content without features or images 
				before( function (done) {
					Factory.build('Content', {creator: user1, layer: layer1}, function(ct){
						content = ct;
						done();
					});
				});
				
				it('should return the created content as JSON', function(done){
					loggedAgent
						.post(apiPrefix + '/contents')
						.send(content)
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err,res){
							// verifies response body
							res.body.creator.should.eql(user1._id.toHexString());
							res.body.layer.should.eql(layer1._id.toHexString());
							res.body.title.should.eql(content.title);
							// verifies db
							Content.findById(res.body._id, function(err, ct){
								should.not.exist(err);
								should.exist(ct);
								ct.creator.should.eql(user1._id);
								ct.layer.should.eql(layer1._id);
							})
							done();
							});
				});
			});

			describe('with 1 feature, without images', function(){
				var
					feature,
					content;

				before( function (done) {
					Factory.create('Feature', {creator: user1._id, layers: [layer1]}, function(ft){
						Factory.build('Content', {creator: user1, layer: layer1, features: [ft._id]}, function(ct){
							content = ct;
							feature = ft;
							done();
						});
					})
				});
				
				it('should return the created content as JSON', function(done){
					// console.log('content dentro do test\n'+content);
					loggedAgent
						.post(apiPrefix + '/contents')
						.send(content)
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err,res){
							// console.log(res.body);
							// verifies response body
							res.body.creator.should.eql(user1._id.toHexString());
							res.body.layer.should.eql(layer1._id.toHexString());
							res.body.features[0].should.eql(feature._id.toHexString());
							res.body.title.should.eql(content.title);
							
							// verifies db
							
							async.parallel([
								function(callback){
									Content.findById(res.body._id, function(err, ct){
										should.not.exist(err);
										should.exist(ct);
										ct.creator.should.eql(user1._id);
										ct.layer.should.eql(layer1._id);
										ct.features.length.should.eql(1);
										ct.features[0].should.eql(feature._id);
										callback();
									})
								},
								function(callback){
									Feature.findById(res.body.features[0], function(err, ft){
										// console.log('the feature in db\n'+ft);
										should.not.exist(err);
										should.exist(ft);
										ft.creator.should.eql(user1._id);
										ft.layers.should.include(layer1._id);
										ft.contents.length.should.eql(1);
										ft.contents.should.include(content._id);
										callback();
									})
								}
								], done);
						});
				});
			});
			
			describe('with 2 features, without images', function(){
				var
					content,
					feature1,
					feature2;

				before( function (done) {
					Factory.create('Feature', {creator: user1._id, layers: [layer1]}, function(ft1){
						Factory.create('Feature', {creator: user1._id, layers: [layer1]}, function(ft2){
							Factory.build('Content', {creator: user1, layer: layer1, features: [ft1._id, ft2._id]}, function(ct){
								content = ct;
								feature1 = ft1;
								feature2 = ft2;
								done();
							});
						});
					})
				});
				
				it('should return the created content as JSON', function(done){
					// console.log('content dentro do test\n'+content);
					loggedAgent
						.post(apiPrefix + '/contents')
						.send(content)
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err,res){
							// console.log('response after post content\n' + res.body);
							
							// verifies response body
							res.body.creator.should.eql(user1._id.toHexString());
							res.body.layer.should.eql(layer1._id.toHexString());
							res.body.features.length.should.eql(2);
							res.body.features.should.include(feature1._id.toHexString());
							res.body.features.should.include(feature2._id.toHexString());							
							res.body.title.should.eql(content.title);
							
							// verifies saved objects
							async.parallel([
								function(callback){
									
									// the content
									Content.findById(res.body._id, function(err, ct){
										should.not.exist(err);
										should.exist(ct);
										ct.creator.should.eql(user1._id);
										ct.layer.should.eql(layer1._id);
										ct.features.length.should.eql(2);
										ct.features.should.include(feature1._id);
										ct.features.should.include(feature2._id);
										callback();
									})
								},
								function(callback){
									
									// the features
									async.parallel([
										function(cb){
											Feature.findById(res.body.features[0], function(err, ft){
												// console.log('the feature in db\n'+ft);
												should.not.exist(err);
												should.exist(ft);
												ft.creator.should.eql(user1._id);
												ft.layers.should.include(layer1._id);
												ft.contents.length.should.eql(1);
												ft.contents.should.include(content._id);
												cb();
											});
										},
										function(cb){
											Feature.findById(res.body.features[1], function(err, ft){
												// console.log('the feature in db\n'+ft);
												should.not.exist(err);
												should.exist(ft);
												ft.creator.should.eql(user1._id);
												ft.layers.should.include(layer1._id);
												ft.contents.length.should.eql(1);
												ft.contents.should.include(content._id);
												cb();
											});
										}
									], callback);
								}], done);
							});
				});
			});
			
			describe('without features, 1 image', function(){
				var
					image,
					content;

				before( function (done) {
					Factory.create('Image', {sourcefile: imageFile}, function(img){
						image = img;
						img.uploadImageAndSave(imageFile, 'url', function(err){
							should.not.exist(err);
							Factory.build('Content', {creator: user1, layer: layer1}, function(ct){
								ct.sirTrevorData = [{
									data: image,
									type: "image"
								}]
								content = ct;
								done();
							});
						});
					});
				});
				
				it('should return the created content as JSON', function(done){
					// console.log('content to be send 1 image no features\n'+ content);

					loggedAgent
						.post(apiPrefix + '/contents')
						.send(content)
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err,res){
							// console.log(res.body.sirTrevorData[0]);
							// verifies response body
							res.body.creator.should.eql(user1._id.toHexString());
							res.body.layer.should.eql(layer1._id.toHexString());
							res.body.sirTrevorData.length.should.eql(1);
							res.body.sirTrevorData[0].data._id.should.eql(image._id.toHexString());
							res.body.title.should.eql(content.title);
							
							// verifies db
							
							async.parallel([
								function(callback){
									Content.findById(res.body._id, function(err, ct){
										should.not.exist(err);
										should.exist(ct);
										ct.creator.should.eql(user1._id);
										ct.layer.should.eql(layer1._id);
										ct.sirTrevorData.length.should.eql(1);
										ct.sirTrevorData[0].data._id.should.eql(image._id.toHexString());
										callback();
									})
								},
								function(callback){
									Image.findById(res.body.sirTrevorData[0].data._id, function(err, img){
										// console.log('the image in db\n'+img);
										should.not.exist(err);
										should.exist(img);
										img.content.should.eql(content._id);
										callback();
									})
								}
								], done);
						});
				});
			});
			
			describe('without features, 2 images', function(){
				var
					image1,
					image2,
					content;
				
				before(function(done){
					async.parallel([
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
					}], function(err){
							Factory.build('Content', {creator: user1, layer: layer1}, function(cnt){
								cnt.sirTrevorData = [{
									data: image1,
									type: "image"
								},{
									data: image2,
									type: "image"
								}];
								content = cnt;
								done();
							})
					});
				});
				
				it('should return the created content as JSON', function(done){
					// console.log('content to be send 1 image no features\n'+ content);

					loggedAgent
						.post(apiPrefix + '/contents')
						.send(content)
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err,res){
							// console.log(res.body.sirTrevorData[0]);
							// verifies response body
							res.body.creator.should.eql(user1._id.toHexString());
							res.body.layer.should.eql(layer1._id.toHexString());
							res.body.sirTrevorData.length.should.eql(2);
							res.body.sirTrevorData[0].data._id.should.eql(image1._id.toHexString());
							res.body.sirTrevorData[1].data._id.should.eql(image2._id.toHexString());							
							res.body.title.should.eql(content.title);
							
							// verifies db
							
							async.parallel([
								function(callback){
									Content.findById(res.body._id, function(err, ct){
										should.not.exist(err);
										should.exist(ct);
										ct.creator.should.eql(user1._id);
										ct.layer.should.eql(layer1._id);
										ct.sirTrevorData.length.should.eql(2);
										ct.sirTrevorData[0].data._id.should.eql(image1._id.toHexString());
										ct.sirTrevorData[1].data._id.should.eql(image2._id.toHexString());
										callback();
									});
								},
								function(callback){
									Image.findById(res.body.sirTrevorData[0].data._id, function(err, img){
										// console.log('the image in db\n'+img);
										should.not.exist(err);
										should.exist(img);
										img.content.should.eql(content._id);
										callback();
									});
								},
								function(callback){
									Image.findById(res.body.sirTrevorData[1].data._id, function(err, img){
										// console.log('the image in db\n'+img);
										should.not.exist(err);
										should.exist(img);
										img.content.should.eql(content._id);
										callback();
									});
								}
							], done);
						});
				});
				
				
			});
			
			
			
			
			describe('with 2 features, 2 images', function(){
				var
					image1,
					image2,
					feature1,
					feature2,
					content;
				
				before(function(done){
					async.parallel([
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
						},
						function(callback){
							Factory.create('Feature', {creator: user1._id, layers: [layer1]}, function(ft1){
								feature1 = ft1;
								callback();
							});
						},
						function(callback){
							Factory.create('Feature', {creator: user1._id, layers: [layer1]}, function(ft2){
								feature2 = ft2;
								callback();
							});
						}
					], function(err){
							Factory.build('Content', {creator: user1, layer: layer1, features: [feature1, feature2]}, function(cnt){
								cnt.sirTrevorData = [{
									data: image1,
									type: "image"
								},{
									data: image2,
									type: "image"
								}];
								content = cnt;
								done();
							})
					});
				});
				
				it('should return the created content as JSON', function(done){
					// console.log('content dentro do test\n'+content);
					loggedAgent
						.post(apiPrefix + '/contents')
						.send(content)
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err,res){
							// console.log('response after post content\n' + res.body);
							
							// verifies response body
							res.body.creator.should.eql(user1._id.toHexString());
							res.body.layer.should.eql(layer1._id.toHexString());
							res.body.features.length.should.eql(2);
							res.body.features.should.include(feature1._id.toHexString());
							res.body.features.should.include(feature2._id.toHexString());
							res.body.sirTrevorData.length.should.eql(2);
							res.body.sirTrevorData[0].data._id.should.eql(image1._id.toHexString());
							res.body.sirTrevorData[1].data._id.should.eql(image2._id.toHexString());
							res.body.title.should.eql(content.title);

							
							// verifies saved objects
							async.parallel([
								function(callback){
									
									// the content
									Content.findById(res.body._id, function(err, ct){
										should.not.exist(err);
										should.exist(ct);
										ct.creator.should.eql(user1._id);
										ct.layer.should.eql(layer1._id);
										ct.features.length.should.eql(2);
										ct.features.should.include(feature1._id);
										ct.features.should.include(feature2._id);
										ct.sirTrevorData.length.should.eql(2);
										ct.sirTrevorData[0].data._id.should.eql(image1._id.toHexString());
										ct.sirTrevorData[1].data._id.should.eql(image2._id.toHexString());
										callback();
									})
								},
								function(callback){
									// the features
									async.parallel([
										function(cb){
											Feature.findById(res.body.features[0], function(err, ft){
												// console.log('the feature in db\n'+ft);
												should.not.exist(err);
												should.exist(ft);
												ft.creator.should.eql(user1._id);
												ft.layers.should.include(layer1._id);
												ft.contents.length.should.eql(1);
												ft.contents.should.include(content._id);
												cb();
											});
										},
										function(cb){
											Feature.findById(res.body.features[1], function(err, ft){
												// console.log('the feature in db\n'+ft);
												should.not.exist(err);
												should.exist(ft);
												ft.creator.should.eql(user1._id);
												ft.layers.should.include(layer1._id);
												ft.contents.length.should.eql(1);
												ft.contents.should.include(content._id);
												cb();
											});
										},
										function(callback){
											Image.findById(res.body.sirTrevorData[0].data._id, function(err, img){
												// console.log('the image in db\n'+img);
												should.not.exist(err);
												should.exist(img);
												img.content.should.eql(content._id);
												callback();
											});
										},
										function(callback){
											Image.findById(res.body.sirTrevorData[1].data._id, function(err, img){
												// console.log('the image in db\n'+img);
												should.not.exist(err);
												should.exist(img);
												img.content.should.eql(content._id);
												callback();
											});
										}
									], callback);
								}], done);
							});
				});
			});
		});	
	});


	/**
	 * Update Content
	 */
	describe('PUT /contents', function(){
	
	
	});
	
});

function loginUser(agent, user){
	return function(done) {
		agent
		.post('/users/session')
		.send({ email: user.email, password: user.password })
		.end(onResponse);

		function onResponse(err, res) {
			// test redirect to dashboard
			res.should.have.status(302); 
			res.header['location'].should.not.include('/login');
			return done();
		}
	}
}