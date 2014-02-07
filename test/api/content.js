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
	apiPrefix = '/api/v1',
	user1,
	user2,
	layer1;

describe('Content', function(){

	/**
	 * Create Content
	 */
	describe('POST /contents', function(){
		context('When not logged in', function(){
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
	
		context('When logged in', function(){
			
			var 
				agent = request.agent(app),
				user1,
				user2,
				user1Layer,
				user1Feature1,
				user1Feature2,
				user1Content,
				user1ContentId,
				user2Layer,
				user2Feature1;
			
			before(function(done){
				
				async.parallel([
					// user1 layer and features
					function (cb) {
						// Create and save user1
						Factory.create('User', function(usr){
							// Create and save layer for user1
							Factory.create('Layer', {creator: usr._id}, function(lyr){
								Factory.create('Feature', {creator: usr._id}, function(ft1){
									user1Feature1 = ft1;
									Factory.create('Feature', {creator: usr._id}, function(ft2){
										user1Feature2 = ft2;								
										// Build content and don't save
										Factory.build('Content', {
											creator: usr._id,
											layer: lyr._id
										}, function(cnt){
											user1 = usr;
											user1Content = cnt;
											user1Layer = lyr;
											cb();
										});
									});

								});
							});
						});
					},
					// user2 layer and features
					function (cb) {
						// Create and save user2
						Factory.create('User', function(usr){
							// Create and save layer for user2
							Factory.create('Layer', {creator: usr._id}, function(lyr){
								// Create and save features for user2
								Factory.create('Feature', {creator: usr._id}, function(lyr){
									Factory.create('Feature', {creator: usr._id}, function(lyr){
										
										
										
									});
								});
							});
						});
						cb();
					}
				], function() { 
					// after populate, login user1
					return loginUser(agent,user1)(done) 
				});
			});
			
			it('should return created content object as json', function (done) {
				// add features to content
				user1Content.features = [user1Feature1, user1Feature2];

				agent
					.post(apiPrefix + '/contents')
					.send(user1Content)
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(err,res){
						user1ContentId = res.body._id;
						res.body.features.length.should.eql(2);						
						// Test if feature was updated with content_id
						async.each(res.body.features, function(f, cb){
							Feature.findById(f, function(err, ft){
								ft.contents.should.include(user1ContentId);
								cb();
							})
						}, done);
					});
			});
			
			it('should save Content to database', function(done){
				Content.findOne(user1ContentId, function(err, cnt){
					cnt.title.should.eql(user1Content.title);
					cnt.creator.should.eql(user1._id);
					cnt.layer.should.eql(user1Layer._id);
					done();
				})
			});
			
			context('association validation', function(){

				it("should return false if belonging layer wasn't created by the user");

				it("should return false if associated features wasn't created by the user");
				
			})
			
			
		});	
	});


	/**
	 * Update Content
	 */
	describe('PUT /contents', function(){
		
		var 
			agent = request.agent(app),
			user1,
			user1Layer,
			user1Feature1,
			user1Feature2,
			user1Content,
			user1ContentId,
			finishedStep1 = false,
			finishedStep2 = false,
			finishedStep3 = false;
								
		before(function(done){
			// Create and save user1
			Factory.create('User', function(usr){
				// Create and save layer for user1
				Factory.create('Layer', {creator: usr._id}, function(lyr){
					Factory.create('Feature', {creator: usr._id}, function(ft1){
						user1Feature1 = ft1;
						Factory.create('Feature', {creator: usr._id}, function(ft2){
							user1Feature2 = ft2;
							Factory.create('Content', {
								creator: usr._id,
								layer: lyr._id
							}, function(cnt){
								user1 = usr;
								user1Content = cnt;
								user1Layer = lyr;
								loginUser(agent,user1)(done)
							});
						});
					});
				});
			});
		});
		
		context('When not logged in', function(){
			it('should redirect to /login', function (done) {
				request(app)
					.put(apiPrefix + '/contents/' + user1Content._id)
					.expect('Content-Type', /plain/)
					.expect(302)
					.expect('Location', '/login')
					.expect(/Moved Temporarily/)
					.end(done);
			});
		});
		
		context('When logged in', function(){
			
			it('Step 1 - should update references for 2 features', function (done) {
				// set 2 features 
				user1Content.features = [user1Feature1, user1Feature2];
				agent
					.put(apiPrefix + '/contents/' + user1Content._id)
					.send(user1Content)
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(err,res){
						user1ContentId = res.body._id;
						res.body.features.length.should.eql(2);
						// Test if feature was updated with content_id
						async.each(res.body.features, function(f, cb){
							Feature.findById(f, function(err, ft){
								ft.contents.length.should.eql(1);
								ft.contents.should.include(user1ContentId);
								cb();
							})
						}, function(){
							finishedStep1 = true;
							done();
						});
				});
			});
			
			context('step 2', function(){
				
				before(function( done ){
					checkForStep1( done );
				});

				it('should update references for 1 features', function (done) {
					// set 1 features 
					user1Content.features = [user1Feature1];
					process.on('uncaughtException', function(err) {
					    console.log('Caught exception.');
					  });
					console.log('trying to set 1 feature');
					console.log('user1Content para 1 features\n'+user1Content);
					agent
						.put(apiPrefix + '/contents/' + user1Content._id)
						.set('Content-Type', 'application/json')
						.send(user1Content)
						.expect('Content-Type', /json/)
						.expect(200)
						.end(function(err,res){
							should.not.exist(err);
							done();
						});
					// 		res.body.features.length.should.eql(1);
					// 		// Test if feature was updated with content_id
					// 		async.parallel([
					// 			function(cb){
					// 				Feature.findById(user1Feature1._id, function(err, ft1){
					// 					ft1.should.exist;
					// 					ft1.contents.length.should.eql(1);
					// 					ft1.contents.should.include(user1ContentId);
					// 					cb();
					// 				})
					// 			},
					// 			function(cb){
					// 				Feature.findById(user1Feature2._id, function(err, ft2){
					// 					ft2.contents.length.should.eql(0);
					// 					ft2.contents.should.not.include(user1ContentId);
					// 					cb();
					// 				})
					// 			},
					// 			function(cb){
					// 				Content.findById(user1Content._id, function(err, ct){
					// 					ct.features.legnth.shoud.eql(1);
					// 					ct.features.should.include(user1Feature1);
					// 					ct.features.should.not.include(user1Feature2);
					// 					cb();
					// 				})
					// 			}], done);
					// 	});
				});
				
			})

			
			it('should update references when all features removed');

		});
	});
	
	

/*	after(function(done){
		require('../../lib/clear-db').clearDb(done);
	});*/
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