/*
 * Module dependencies.
 */

var 
	should = require('should'),
	request = require('supertest'),
	app = require('../../web'),
	mongoose = require('mongoose'),
	Image = mongoose.model('Image'),
	Factory = require('../../lib/factory'),
	clearDb = require('../../lib/clearDb');

var
	apiPrefix = '/api/v1',
	imageFile = 'fixtures/ecolab.png';

/*
 * Helper function to log a user
 */

function loginUser(agent, user){
	return function(done) {
		agent
		.post(apiPrefix + '/access_token/local')
		.send({ email: user.email, password: user.password })
		.end(onResponse);

		function onResponse(err, res) {
			should.not.exist(err);
			should(res).have.property('status', 200);
			return done();
		}
	}
}



describe('Images API', function(){

	var 
		loggedAgent = request.agent(app),
		user1;

	before(function (done) {
		mongoose.connection.on('open', function(){
			clearDb.run(function(err){
				should.not.exist(err);
				Factory.create('User', function(user){
					user1 = user;
					return loginUser(loggedAgent,user1)(done);
				});			
		  	})			
		});
	})


	after(function (done) {
		clearDb.run(function(err){
			should.not.exist(err);
			done(err);
	  	});
	})

	/**
	 * Create Image
	 */
	describe('POST /images', function(){
		context('not logged in', function(){
			it('should return forbidden', function (done) {
				request(app)
					.post(apiPrefix + '/images')
					.expect('Content-Type', /json/)
					.expect(403)
					.end(done)
			});
		});	
	});	

	/**
	 * Delete Image
	 */
	describe('DEL /images', function(){
		context('not logged in', function(){
			it('should return forbidden', function (done) {
				request(app)
					.del(apiPrefix + '/images')
					.expect('Content-Type', /json/)
					.expect(403)
					.end(done)
			});
		});	
	});	
	
});